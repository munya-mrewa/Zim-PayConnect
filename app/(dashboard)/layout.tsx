import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardShell, SubscriptionStatus } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
  });

  if (!user?.organization) {
      // Handle edge case where user has no org (shouldn't happen with correct flow)
      return <div>Error: No organization found. Please contact support.</div>;
  }

  const org = user.organization;
  let status: SubscriptionStatus['status'] = 'TRIAL';
  let daysLeft = 0;

  const now = new Date();

  if (org.subscriptionStatus === 'ACTIVE') {
      if (org.subscriptionEndsAt && now > org.subscriptionEndsAt) {
          status = 'EXPIRED';
          daysLeft = 0;
      } else {
          status = 'ACTIVE';
          if (org.subscriptionEndsAt) {
            const diffTime = Math.abs(org.subscriptionEndsAt.getTime() - now.getTime());
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
             daysLeft = 30; // Fallback
          }
      }
  } else if (org.subscriptionStatus === 'TRIAL') {
      if (now > org.trialEndsAt) {
          status = 'EXPIRED';
          daysLeft = 0;
      } else {
          status = 'TRIAL';
          const diffTime = Math.abs(org.trialEndsAt.getTime() - now.getTime());
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      }
  } else {
      // Default fallback
      status = (org.subscriptionStatus as any) || 'EXPIRED';
  }

  const subscriptionStatus: SubscriptionStatus = {
      status,
      daysLeft,
      tier: org.subscriptionTier
  };

  return (
    <DashboardShell subscriptionStatus={subscriptionStatus}>
      {children}
    </DashboardShell>
  );
}
