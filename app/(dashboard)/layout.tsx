import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSubscriptionStatus } from "@/lib/auth/subscription";

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

  const subscriptionStatus = getSubscriptionStatus(user.organization);

  return (
    <DashboardShell subscriptionStatus={subscriptionStatus}>
      {children}
    </DashboardShell>
  );
}
