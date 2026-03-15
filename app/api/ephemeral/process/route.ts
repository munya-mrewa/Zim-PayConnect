import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCSVStream, MappingRequiredError } from "@/lib/ephemeral-engine/parser";
import { ColumnMapping, RawPayrollRecord } from "@/lib/ephemeral-engine/types";
import { checkProcessingAccess } from "@/lib/auth/subscription";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";
import { Readable } from "stream";
import { logger } from "@/lib/logger";
import { payrollQueue } from "@/lib/queue/worker";

// Vercel config to allow longer execution for file uploads
export const maxDuration = 300; 

const MAX_FILE_SIZE = 10 * 1024 * 1024; // Increased to 10MB
const HARD_RECORD_LIMIT = 10000; // Increased limit for background processing

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { organization: true }
    });

    if (!user?.organization) {
        return NextResponse.json({ error: "Organization required" }, { status: 403 });
    }

    const org = user.organization;

    // 2. Access Check
    const access = await checkProcessingAccess(org.id);
    if (!access.authorized) {
        return NextResponse.json({ 
            error: "No active subscription or credits.",
            code: "NO_CREDITS"
        }, { status: 403 });
    }

    // 3. Parse Metadata
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mappingJson = formData.get("mapping") as string;
    const processingMonthStr = formData.get("processingMonth") as string;
    
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const processingMonth = parseInt(processingMonthStr) || 1;
    let mapping: ColumnMapping | undefined;
    if (mappingJson) mapping = JSON.parse(mappingJson);

    // 4. Stream Parsing (Keep in request cycle to validate format quickly)
    // @ts-ignore
    const nodeStream = Readable.fromWeb(file.stream());
    const rawRecords: RawPayrollRecord[] = [];
    
    try {
        for await (const record of parseCSVStream(nodeStream, mapping)) {
            if (rawRecords.length >= HARD_RECORD_LIMIT) {
                return NextResponse.json({ error: `Too many records` }, { status: 400 });
            }
            rawRecords.push(record);
        }
    } catch (error) {
        if (error instanceof MappingRequiredError) {
             return NextResponse.json({
                error: "Column mapping required",
                code: "MAPPING_REQUIRED",
                headers: error.headers
            }, { status: 422 });
        }
        throw error;
    }

    const recordCount = rawRecords.length;

    // 5. Plan Limits Check
    const planId = org.subscriptionTier as SubscriptionPlanId;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0]; 
    
    if (access.method === "SUBSCRIPTION" && plan.maxEmployees !== 'Unlimited' && recordCount > plan.maxEmployees) {
        return NextResponse.json({ error: `Plan limit exceeded (${plan.maxEmployees} employees).` }, { status: 403 });
    }

    if (access.method === "CREDIT" && recordCount > 100) {
        return NextResponse.json({ error: "Credit processing is limited to 100 employees per batch." }, { status: 403 });
    }

    // 6. Exchange Rate
    const rateObj = await db.exchangeRate.findFirst({ orderBy: { effectiveDate: "desc" }});
    const currentRate = rateObj ? Number(rateObj.rate) : 28.0000;

    // 7. Initialize Audit Log (PENDING)
    const auditLog = await db.auditLog.create({
        data: {
            organizationId: org.id,
            userId: user.id,
            action: "UPLOAD_PAYROLL",
            status: "FAILURE", // Default until worker succeeds
            fileName: file.name,
            fileSize: file.size,
            recordCount: recordCount,
            metadata: { 
                startTime: new Date().toISOString(),
                requestStart: startTime,
                method: access.method,
                exchangeRateUsed: currentRate
            }
        }
    });

    // 8. Queue Background Job
    const taxConfig = {
        nssaEnabled: org.nssaEnabled,
        nssaRate: org.nssaRate.toNumber(),
        nssaCeilingUSD: org.nssaCeilingUSD.toNumber(),
        nssaCeilingZiG: org.nssaCeilingZiG.toNumber(),
        necEnabled: org.necEnabled,
        necRate: org.necRate.toNumber(),
        sdfEnabled: org.sdfEnabled,
        sdfRate: org.sdfRate.toNumber(),
        exchangeRate: currentRate,
        defaultCurrency: org.defaultCurrency as any,
        processingMonth
    };

    const isWhiteLabeled = (['AGENCY', 'ENTERPRISE'] as SubscriptionPlanId[]).includes(plan.id);

    const job = await payrollQueue.add("process-payroll", {
        records: rawRecords,
        taxConfig,
        orgInfo: {
            id: org.id,
            name: org.name,
            tin: org.tin || undefined,
            logoUrl: isWhiteLabeled ? org.logoUrl : null
        },
        auditId: auditLog.id,
        removeBranding: isWhiteLabeled
    });

    // 9. Deduct Credits if applicable
    if (access.method === "CREDIT") {
        await db.organization.update({
            where: { id: org.id },
            data: { credits: { decrement: 1 } }
        });
    }

    logger.info({ jobId: job.id, orgId: org.id }, "Payroll offloaded to background worker");

    return NextResponse.json({
        message: "Processing started",
        jobId: job.id,
        processedRecords: recordCount,
        auditId: auditLog.id
    });

  } catch (error) {
    logger.error({ err: error }, "Upload failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

