import { ClientForm } from "@/components/forms/client-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";
import { ClientLimitReached } from "@/components/clients/client-limit-reached";

export default async function NewClientPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      include: { 
          _count: {
              select: { clients: true }
          }
      }
  });

  if (!org) return <div>Organization not found</div>;

  const planId = (org.subscriptionTier as SubscriptionPlanId) || "MICRO";
  
  // Enterprise has unlimited clients
  if (planId === 'ENTERPRISE') {
      return (
        <div className="flex-1 space-y-4 p-8 pt-6">
          <ClientForm />
        </div>
      );
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  const currentCount = org._count.clients;
  const baseLimit = plan?.maxClientTins || 0;
  const totalLimit = baseLimit + (org.extraClientSlots || 0);

  if (currentCount >= totalLimit) {
      if (planId === 'AGENCY') {
          return (
             <div className="flex-1 space-y-4 p-8 pt-6">
                 <ClientLimitReached orgId={org.id} maxClients={totalLimit} />
             </div>
          );
      } else {
          return (
              <div className="flex-1 space-y-4 p-8 pt-6 text-center">
                  <h2 className="text-xl font-bold text-red-600">Upgrade Required</h2>
                  <p className="mt-2 text-muted-foreground">Your current plan ({planId}) does not support client management.</p>
                  <a href="/upgrade" className="mt-4 inline-block text-primary hover:underline">Upgrade to Agency / Institutional Plan</a>
              </div>
          );
      }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ClientForm />
    </div>
  );
}
