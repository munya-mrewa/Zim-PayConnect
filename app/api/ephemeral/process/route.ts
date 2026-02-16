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

    // If using Credit, we verify they have it (already done in checkProcessingAccess),
    // but we deduct ONLY after successful processing to prevent loss on errors.

    // 3. Get Plan Limits
    // If credit, we use a fallback "Pay-Per-Process" limit or the stored tier limit?
    // Let's assume Credit users get MICRO limits (10 employees) unless they have a higher tier expired?
    // Actually, Pay-Per-Process should probably support more employees if they pay for it.
    // For now, if CREDIT, we use 'MICRO' limits as default if tier is missing or expired.
    // Or we can say Pay-Per-Process allows up to 50 employees (Standard).
    
    let planId = org.subscriptionTier as SubscriptionPlanId;
    // If expired/trial ended, but we allowed via CREDIT, we should probably enforce a decent limit.
    // Let's stick to the stored tier for simplicity, or default to MICRO if invalid.
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0]; 

    // 4. Parse File
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mappingJson = formData.get("mapping") as string;
    
    let mapping: ColumnMapping | undefined;
    if (mappingJson) {
        try {
            mapping = JSON.parse(mappingJson);
        } catch (e) {
            console.warn("Invalid mapping JSON");
        }
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // STREAM-BASED PARSING START
    // Convert Web Stream to Node Stream
    // @ts-ignore
    const nodeStream = Readable.fromWeb(file.stream());
    
    const processedData = [];
    let processedCount = 0;

    try {
        for await (const record of parseCSVStream(nodeStream, mapping)) {
            const validation = validateRecord(record);
            processedData.push({
                ...record,
                taxResult: calculateTax(record, taxConfig),
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
    // Only deduct after successful parsing and limit checks passed.
    if (access.method === "CREDIT") {
        await db.organization.update({
            where: { id: org.id },
            data: { credits: { decrement: 1 } }
        });
    }

    // 7. Audit Log (Prisma)
    try {
        await db.auditLog.create({
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
                    method: access.method // Log if CREDIT was used
                }
            }
        });
    } catch (dbError) {
        console.error("Failed to write audit log:", dbError);
    }

    // 8. White-label Check
    const isWhiteLabeled = (['AGENCY', 'ENTERPRISE'] as SubscriptionPlanId[]).includes(plan.id);
    const effectiveLogoUrl = isWhiteLabeled ? logoUrl : null;

    return NextResponse.json({
        message: "Processing complete",
        processedRecords: recordCount,
        data: processedData, // Return processed data
        auditId: "generated-id", // Placeholder
        meta: {
            isWhiteLabeled,
            logoUrl: effectiveLogoUrl,
            orgName: org.name,
            tin: org.tin,
            creditsUsed: access.method === "CREDIT" ? 1 : 0,
            generatedAt: new Date().toISOString()
        }
    });

  } catch (error) {
    console.error("Processing failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

