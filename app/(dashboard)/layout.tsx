import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { stopImpersonation } from "@/actions/impersonate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  let organization;

  if (session.user.isImpersonating) {
      organization = await db.organization.findUnique({
          where: { id: session.user.organizationId }
      });
  } else {
      const user = await db.user.findUnique({
          where: { id: session.user.id },
          include: { organization: true }
      });
      organization = user?.organization;
  }

  if (!organization) {
      // Handle edge case where user has no org
      return <div>Error: No organization found. Please contact support.</div>;
  }

  const subscriptionStatus = getSubscriptionStatus(organization);

  return (
    <DashboardShell subscriptionStatus={subscriptionStatus}>
      {session.user.isImpersonating && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex justify-between items-center sticky top-0 z-50">
           <span className="flex items-center gap-2">
             <span>👁️</span>
             <span>You are viewing <strong>{organization.name}</strong> as an Admin.</span>
           </span>
           <form action={stopImpersonation}>
              <button type="submit" className="underline hover:no-underline font-medium">
                Exit Impersonation
              </button>
           </form>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
