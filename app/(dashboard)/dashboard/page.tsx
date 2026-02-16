import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, History, Settings, Activity } from "lucide-react";
import { getVolumeHistory, getOnboardingStatus } from "@/app/actions/dashboard";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { CreditBalance } from "@/components/dashboard/credit-balance";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !session.user.organizationId) {
      redirect("/login");
  }

  const org = await db.organization.findUnique({ 
      where: { id: session.user.organizationId },
  });

  if (!org) {
      // This case might happen if an org is deleted but the user's session is still valid.
      // Or if the organizationId in the session is stale.
      // We should probably log this event and redirect to a safe page.
      console.warn(`User ${session.user.id} has a stale organizationId: ${session.user.organizationId}`);
      redirect("/login"); 
  }

  const [volumeData, onboarding] = await Promise.all([
      getVolumeHistory(org.id),
      getOnboardingStatus(org)
  ]);

  const totalProcessed = volumeData.reduce((acc: number, curr: any) => acc + curr.count, 0);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {!onboarding.completed && <OnboardingWizard steps={onboarding.steps} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Records</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Total records processed
            </p>
          </CardContent>
        </Card>

         <DashboardStats subscriptionTier={org.subscriptionTier} />
         
         <CreditBalance credits={org.credits} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Processing Volume</CardTitle>
            <CardDescription>
              Records processed over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <VolumeChart data={volumeData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/upload"><Upload className="mr-2 h-4 w-4" /> Upload New Payroll</Link>
             </Button>
             <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/history"><History className="mr-2 h-4 w-4" /> View Audit Logs</Link>
             </Button>
             <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Organization Settings</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
