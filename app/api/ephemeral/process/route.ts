import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCSVStream, MappingRequiredError } from "@/lib/ephemeral-engine/parser";
import { ColumnMapping } from "@/lib/ephemeral-engine/types";
import { calculateTax } from "@/lib/ephemeral-engine/calculator";
import { validateRecord } from "@/lib/ephemeral-engine/validator";
import { checkProcessingAccess } from "@/lib/auth/subscription";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";
import { Readable } from "stream";
import { logger } from "@/lib/logger";

// Vercel config to allow longer execution for file uploads
export const maxDuration = 300; // 5 minutes

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const HARD_RECORD_LIMIT = 5000; // Safeguard against gigantic files

export async function POST(request: Request) {
  const startTime = Date.now();
  let recordCount = 0;

  try {
    // 1. Authenticate
    let userId: string | undefined;
    const session = await getServerSession(authOptions);

    // DEV BYPASS
    if (process.env.NODE_ENV === "development") {
        const bypassId = request.headers.get("x-test-user-id");
        if (bypassId) userId = bypassId;
    }

    if (!userId && session?.user?.id) {
        userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { organization: true }
    });

    if (!user || !user.organizationId || !user.organization) {
        return NextResponse.json({ error: "Organization required" }, { status: 403 });
    }

    const org = user.organization;

    // --- Exchange Rate Safety Check ---
    const defaultCurrency = org.defaultCurrency as "USD" | "ZiG";
    const rateObj = await db.exchangeRate.findFirst({ orderBy: { effectiveDate: "desc" }});
    
    if (!rateObj && defaultCurrency === 'USD') {
        return NextResponse.json({ 
            error: "No exchange rate found in the system. Please update exchange rates in Settings before processing USD payrolls.",
            code: "MISSING_RATE"
        }, { status: 400 });
    }
    const currentRate = rateObj ? Number(rateObj.rate) : 28.0000;

    // Construct Tax Configuration from Org Settings
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
        defaultCurrency
    };

    // White-Label Config
    const logoUrl = org.logoUrl;

    // 2. Check Access (Subscription OR Credit)
    const access = await checkProcessingAccess(org.id);
    
    if (!access.authorized) {
        return NextResponse.json({ 
            error: "No active subscription or credits. Please upgrade or buy credits.",
            redirect: "/settings",
            code: "NO_CREDITS"
        }, { status: 403 });
    }

    // 3. Get Plan Limits
    let planId = org.subscriptionTier as SubscriptionPlanId;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0]; 

    // 4. Parse File
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mappingJson = formData.get("mapping") as string;
    const processingMonthStr = formData.get("processingMonth") as string;
    
    let processingMonth = 1; // Default to January if not specified
    if (processingMonthStr) {
        const m = parseInt(processingMonthStr);
        if (!isNaN(m) && m >= 1 && m <= 12) {
            processingMonth = m;
        }
    }

    let mapping: ColumnMapping | undefined;
    if (mappingJson) {
        try {
            mapping = JSON.parse(mappingJson);
        } catch (e) {
            logger.warn("Invalid mapping JSON");
        }
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB size limit" }, { status: 400 });
    }

    // STREAM-BASED PARSING START
    // Convert Web Stream to Node Stream
    // @ts-ignore
    const nodeStream = Readable.fromWeb(file.stream());
    
    const processedData = [];
    let processedCount = 0;

    try {
        for await (const record of parseCSVStream(nodeStream, mapping)) {
            if (processedCount >= HARD_RECORD_LIMIT) {
                return NextResponse.json({ error: `File exceeds maximum allowed records (${HARD_RECORD_LIMIT})` }, { status: 400 });
            }

            const validation = validateRecord(record);
            // Merge org config with request-specific config (processingMonth)
            const requestConfig = { ...taxConfig, processingMonth };
            
            processedData.push({
                ...record,
                taxResult: calculateTax(record, requestConfig),
                isValid: validation.isValid,
                validationErrors: validation.errors
            });
            processedCount++;
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
    
    recordCount = processedCount;
    // STREAM-BASED PARSING END

    // 5. Enforce Employee Limit
    const isCredit = access.method === "CREDIT";
    const MAX_CREDIT_EMPLOYEES = 100;

    if (isCredit) {
        if (recordCount > MAX_CREDIT_EMPLOYEES) {
             return NextResponse.json({ 
                error: `Credit processing is limited to ${MAX_CREDIT_EMPLOYEES} employees per file. Please upgrade to a higher tier plan for larger files.`,
                action: "UPGRADE_REQUIRED"
            }, { status: 403 });
        }
    } else {
        // Subscription checks
        if (plan.maxEmployees !== 'Unlimited' && recordCount > plan.maxEmployees) {
            return NextResponse.json({ 
                error: `Plan limit exceeded. Your ${plan.name} plan allows up to ${plan.maxEmployees} employees. Uploaded: ${recordCount}.`,
                action: "UPGRADE_REQUIRED"
            }, { status: 403 });
        }
    }

    // 6. Deduct Credit (if applicable)
    if (access.method === "CREDIT") {
        await db.organization.update({
            where: { id: org.id },
            data: { credits: { decrement: 1 } }
        });
    }

    // 7. Audit Log (Prisma)
    let auditLogId = "generated-id";
    try {
        const log = await db.auditLog.create({
            data: {
                organizationId: org.id,
                userId: user.id,
                action: "UPLOAD_PAYROLL",
                status: "SUCCESS",
                fileName: file.name,
                fileSize: file.size,
                recordCount: recordCount,
                metadata: { 
                    processingTimeMs: Date.now() - startTime,
                    method: access.method,
                    exchangeRateUsed: currentRate,
                    version: "1.1"
                }
            }
        });
        auditLogId = log.id;
    } catch (dbError) {
        logger.error({ err: dbError }, "Failed to write audit log");
    }

    // 8. White-label Check
    const isWhiteLabeled = (['AGENCY', 'ENTERPRISE'] as SubscriptionPlanId[]).includes(plan.id);
    const effectiveLogoUrl = isWhiteLabeled ? logoUrl : null;

    logger.info({ orgId: org.id, records: recordCount, method: access.method }, "File processed successfully");

    // NOTE: In the real Dokploy environment, you would push 'processedData' to BullMQ here 
    // to generate the ZIP asynchronously to avoid OOM errors. 
    // Example: await queue.add("generate-zip", { data: processedData, orgId, auditId });

    return NextResponse.json({
        message: "Processing complete",
        processedRecords: recordCount,
        data: processedData, 
        auditId: auditLogId, 
        meta: {
            isWhiteLabeled,
            logoUrl: effectiveLogoUrl,
            orgName: org.name,
            tin: org.tin,
            creditsUsed: access.method === "CREDIT" ? 1 : 0,
            generatedAt: new Date().toISOString(),
            exchangeRateUsed: currentRate
        }
    });

  } catch (error) {
    logger.error({ err: error }, "Processing failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

