import { PricingSection } from "@/components/pricing-section";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { AlertTriangle } from "lucide-react";

export default async function UpgradePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
        redirect("/login");
    }

    const org = await db.organization.findUnique({
        where: { id: session.user.organizationId },
    });
    
    if (!org) {
        redirect("/login");
    }

    const { status } = getSubscriptionStatus(org);
    const isTrial = status === 'TRIAL';
    const isExpired = status === 'EXPIRED';

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex flex-col space-y-2">
                {isExpired ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4 text-center">
                         <div className="flex justify-center mb-2">
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                         </div>
                         <h2 className="text-3xl font-bold tracking-tight text-red-900 mb-2">
                            Your Free Trial Has Expired
                        </h2>
                        <p className="text-lg text-red-700 max-w-2xl mx-auto">
                            To continue processing payrolls, generating reports, and accessing your history, please select a subscription plan below. Your data is safe, but access is restricted until you upgrade.
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {isTrial ? "Select Your Trial Plan" : "Upgrade Your Plan"}
                            </h2>
                            <p className="text-muted-foreground">
                                {isTrial
                                    ? "Choose the plan you want to use during your 7-day free trial."
                                    : "Select a plan to upgrade your account."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <PricingSection isTrial={isTrial} />
        </div>
    );
}
