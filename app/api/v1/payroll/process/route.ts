import { NextResponse } from "next/server";
import { ApiKeyService } from "@/lib/auth/api-key";
import { payrollQueue } from "@/lib/queue/client";
import { RawPayrollRecord } from "@/lib/ephemeral-engine/types";
import { db } from "@/lib/db";
import { AuditService } from "@/lib/audit-service";
import { AuditAction, AuditStatus } from "@prisma/client";

// Increase timeout for longer payloads if Vercel allows
export const maxDuration = 60; 

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Auth Check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const apiKey = authHeader.split(" ")[1];
    const organization = await ApiKeyService.validate(apiKey);

    if (!organization) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // 2. Validate Payload
    const body = await request.json();
    if (!body.records || !Array.isArray(body.records)) {
      return NextResponse.json({ error: "Payload must contain 'records' array" }, { status: 400 });
    }

    const rawRecords: RawPayrollRecord[] = body.records;
    if (rawRecords.length === 0) {
      return NextResponse.json({ error: "No records provided" }, { status: 400 });
    }

    // 3. Plan Limits (Optional Check - assuming API users are Enterprise/Agency generally)
    if (rawRecords.length > 500) { // Hard limit for API for now
        return NextResponse.json({ error: "Batch size limit exceeded (max 500 per request)" }, { status: 400 });
    }

    // 4. Exchange Rate Logic (Use stored or fallback)
    const rateObj = await db.exchangeRate.findFirst({ orderBy: { effectiveDate: "desc" }});
    const currentRate = rateObj ? Number(rateObj.rate) : 28.0000;

    // 5. Config Setup
    const taxConfig = {
        nssaEnabled: organization.nssaEnabled,
        nssaRate: Number(organization.nssaRate),
        nssaCeilingUSD: Number(organization.nssaCeilingUSD),
        nssaCeilingZiG: Number(organization.nssaCeilingZiG),
        necEnabled: organization.necEnabled,
        necRate: Number(organization.necRate),
        sdfEnabled: organization.sdfEnabled,
        sdfRate: Number(organization.sdfRate),
        exchangeRate: currentRate,
        defaultCurrency: organization.defaultCurrency as any,
        processingMonth: body.processingMonth || new Date().getMonth() + 1
    };

    // 6. Audit Log (Initial)
    const auditLog = await AuditService.log({
        organizationId: organization.id,
        action: AuditAction.UPLOAD_PAYROLL, // Reusing existing action
        status: AuditStatus.SUCCESS, // Pending/Success
        recordCount: rawRecords.length,
        metadata: {
            source: "API",
            startTime: new Date().toISOString()
        }
    });

    if (!auditLog) throw new Error("Audit log failed");

    // 7. Queue Job
    const job = await payrollQueue.add("process-payroll", {
        records: rawRecords,
        taxConfig,
        orgInfo: {
            id: organization.id,
            name: organization.name,
            tin: organization.tin || undefined,
            logoUrl: organization.logoUrl
        },
        auditId: auditLog.id,
        removeBranding: true, // API users get white-label by default? Or based on plan?
        metadata: {
            source: "API",
            startTime: new Date().toISOString()
        }
    });

    return NextResponse.json({
        jobId: job.id,
        status: "queued",
        recordCount: rawRecords.length,
        trackingId: auditLog.id
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
