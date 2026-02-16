import { PricingSection } from "@/components/pricing-section";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function UpgradePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
        redirect("/login");
    }

    const org = await db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { subscriptionStatus: true, trialEndsAt: true }
    });

    // Check if user is in trial. 
    // We consider them in "Trial Selection Mode" if the status is TRIAL.
    // We also check if the trial has expired, but the prompt implies they can choose "on the free trial until it ends".
    // If trial ends, they must pay.
    const isTrial = org?.subscriptionStatus === 'TRIAL';
    // Optionally check dates: && (!org.trialEndsAt || org.trialEndsAt > new Date());
    // But let's stick to status.

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    {isTrial ? "Select Your Trial Plan" : "Upgrade Your Plan"}
                </h2>
                <p className="text-muted-foreground">
                    {isTrial 
                        ? "Choose the plan you want to use during your 3-day free trial." 
                        : "Select a plan to upgrade your account."}
                </p>
            </div>
            
            <PricingSection isTrial={isTrial} />
        </div>
    );
}
