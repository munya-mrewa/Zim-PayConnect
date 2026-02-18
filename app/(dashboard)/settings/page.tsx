import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PricingPlans } from "@/components/dashboard/PricingPlans";
import { SettingsForm } from "./settings-form";
import { PasswordForm } from "./password-form";
import { TaxSettingsForm } from "./tax-settings-form";
import { BrandingForm } from "./branding-form";

import { AccountManagerCard } from "./account-manager-card";
import { SlaReportDownloadButton } from "@/components/reports/sla-download-button";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { 
      organization: {
        include: {
          accountManager: true
        }
      }
    },
  });

  if (!user || !user.organization) {
    // Should not happen for valid session, but safe fallback
    return <div>Organization not found.</div>;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="space-y-2">
         <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
         <p className="text-muted-foreground">
            Manage your organization profile and system preferences.
         </p>
      </div>

      <div className="grid gap-8">
         {user.organization.accountManager && (
            <AccountManagerCard manager={user.organization.accountManager} />
         )}

         {user.organization.subscriptionTier === 'ENTERPRISE' && (
             <div className="rounded-md border p-4 bg-card">
                 <h3 className="text-lg font-medium mb-2">Enterprise Compliance</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                     Access your guaranteed Service Level Agreement (SLA) reports and uptime statistics.
                 </p>
                 <SlaReportDownloadButton />
             </div>
         )}

         <SettingsForm 
            initialData={{
                name: user.organization.name,
                tin: user.organization.tin || "",
                contactEmail: user.organization.contactEmail || "",
                address: user.organization.address || ""
            }}
         />

         <TaxSettingsForm 
            initialData={{
                defaultCurrency: user.organization.defaultCurrency as "USD" | "ZiG",
                nssaEnabled: user.organization.nssaEnabled,
                nssaRate: user.organization.nssaRate.toNumber(),
                nssaCeilingUSD: user.organization.nssaCeilingUSD.toNumber(),
                nssaCeilingZiG: user.organization.nssaCeilingZiG.toNumber(),
                necEnabled: user.organization.necEnabled,
                necRate: user.organization.necRate.toNumber(),
                sdfEnabled: user.organization.sdfEnabled,
                sdfRate: user.organization.sdfRate.toNumber()
            }}
         />
         
         <BrandingForm 
            initialLogoUrl={user.organization.logoUrl}
            subscriptionTier={user.organization.subscriptionTier}
         />

         <PasswordForm />

         <div className="space-y-4">
            <h3 className="text-lg font-medium">Subscription Plans</h3>
            <PricingPlans />
         </div>
      </div>
    </div>
  );
}
