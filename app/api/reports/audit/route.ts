import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";
import { AuditService } from "@/lib/audit-service";
import { AuditAction, AuditStatus } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        });

        if (!user || !user.organization) {
            return NextResponse.json({ error: "Organization required" }, { status: 403 });
        }

        const org = user.organization;
        const tier = org.subscriptionTier as SubscriptionPlanId;
        
        // Feature Check: "Mock Audit Reports" requires BUSINESS or higher
        // MICRO does NOT have this.
        const allowedTiers: SubscriptionPlanId[] = ['BUSINESS', 'AGENCY', 'ENTERPRISE'];
        
        if (!allowedTiers.includes(tier)) {
            return NextResponse.json({ 
                error: "This feature requires the Business plan or higher.",
                requiredPlan: "BUSINESS",
                action: "UPGRADE_REQUIRED"
            }, { status: 403 });
        }

        // Fetch actual audit logs
        const logs = await AuditService.getLogs(org.id, 1000);

        // Analyze logs to calculate real metrics
        const totalRuns = logs.filter(l => l.action === 'UPLOAD_PAYROLL').length;
        const failedRuns = logs.filter(l => l.action === 'UPLOAD_PAYROLL' && l.status === 'FAILURE').length;
        
        const complianceScore = totalRuns === 0 ? "N/A" : `${Math.round(((totalRuns - failedRuns) / totalRuns) * 100)}%`;
        
        const issues = failedRuns > 0 ? [
            { severity: "HIGH", description: `${failedRuns} failed payroll processing runs detected.` }
        ] : [
            { severity: "INFO", description: "All recent payroll runs successful." }
        ];

        const reportData = {
            reportType: "ZIMRA Audit Report",
            generatedAt: new Date().toISOString(),
            organization: org.name,
            tin: org.tin || "N/A",
            complianceScore,
            issues,
            recentActivity: logs.map(log => ({
                action: log.action,
                status: log.status,
                date: log.createdAt,
                user: log.user?.email || "System",
                details: log.metadata || {}
            }))
        };

        // Audit this action
        await AuditService.log({
            organizationId: org.id,
            userId: user.id,
            action: AuditAction.GENERATE_REPORT,
            status: AuditStatus.SUCCESS,
            fileName: "audit_report.json",
            recordCount: logs.length,
            metadata: { type: "AUDIT_REPORT" }
        });

        return NextResponse.json(reportData);

    } catch (error) {
        console.error("Report generation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
