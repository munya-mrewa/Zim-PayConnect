import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";

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

        // Generate Mock Audit Report (Data Logic)
        // In a real app, this would query historical data and format it like a ZIMRA request.
        // For now, we return a structured JSON response simulating the report.
        
        const reportData = {
            reportType: "ZIMRA Mock Audit",
            generatedAt: new Date().toISOString(),
            organization: org.name,
            tin: org.tin || "N/A",
            complianceScore: "98%", // Mock
            issues: [
                { severity: "LOW", description: "Missing TIN for 2 employees" },
                { severity: "INFO", description: "Tax calculation matches latest brackets" }
            ]
        };

        // Audit this action
        await db.auditLog.create({
            data: {
                organizationId: org.id,
                userId: user.id,
                action: "GENERATE_REPORT", // Using existing enum or string
                status: "SUCCESS",
                fileName: "mock_audit_report.json",
                recordCount: 1,
                metadata: { type: "MOCK_AUDIT" }
            }
        });

        return NextResponse.json(reportData);

    } catch (error) {
        console.error("Report generation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
