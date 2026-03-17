import { db } from "@/lib/db";

import { Organization } from "@prisma/client";

export type SubscriptionStatusResult = {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED';
  daysLeft: number;
  tier: string;
};

export function getSubscriptionStatus(org: Organization): SubscriptionStatusResult {
  let status: SubscriptionStatusResult['status'] = 'TRIAL';
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
             daysLeft = 30; // Fallback or assume monthly rolling
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

  return {
      status,
      daysLeft,
      tier: org.subscriptionTier
  };
}

export async function checkSubscriptionAccess(orgId: string): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    },
  });

  if (!org) {
    return false;
  }

  const now = new Date();

  // Logic: If `subscriptionStatus` is "TRIAL" and `now > trialEndsAt`, return FALSE.
  if (org.subscriptionStatus === "TRIAL") {
    if (now > org.trialEndsAt) {
      return false;
    }
    return true;
  }

  // Logic: If `subscriptionStatus` is "ACTIVE" and `now > subscriptionEndsAt`, return FALSE.
  if (org.subscriptionStatus === "ACTIVE") {
    if (org.subscriptionEndsAt && now > org.subscriptionEndsAt) {
      return false; // Expired
    }
    // If ACTIVE and subscriptionEndsAt is null, assume lifetime or indefinitely active (or data error, but we'll be permissive for ACTIVE)
    return true;
  }

  // For other statuses like PAST_DUE or CANCELLED, return false by default logic unless specified otherwise.
  return false;
}

export type AccessMethod = "SUBSCRIPTION" | "CREDIT" | null;

export async function checkProcessingAccess(orgId: string): Promise<{ authorized: boolean, method: AccessMethod }> {
    // 1. Check Subscription First (Unlimited Access)
    const hasSub = await checkSubscriptionAccess(orgId);
    if (hasSub) {
        return { authorized: true, method: "SUBSCRIPTION" };
    }

    // 2. Check Credits
    const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { credits: true }
    });

    if (org && org.credits > 0) {
        return { authorized: true, method: "CREDIT" };
    }

    return { authorized: false, method: null };
}

/**
 * Helper for Server Actions to ensure the user has an active trial or subscription.
 * Throws an error if unauthorized to prevent action execution.
 */
export async function requireActiveSubscription(orgId: string) {
    const isAuthorized = await checkSubscriptionAccess(orgId);
    
    if (!isAuthorized) {
        // Check if they have credits at least
        const org = await db.organization.findUnique({
            where: { id: orgId },
            select: { credits: true }
        });

        if (!org || org.credits <= 0) {
            throw new Error("SUBSCRIPTION_EXPIRED");
        }
    }
}
