import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPesepay } from "@/lib/pesepay";
import { getPlanById } from "@/lib/config/pricing";

export async function POST(req: Request) {
  try {
    // Pesepay webhook handling
    const text = await req.text();
    let pollUrl: string | null = null;
    let reference: string | null = null;

    if (text.startsWith("{")) {
        try {
            const json = JSON.parse(text);
            pollUrl = json.pollUrl || json.pollurl;
            reference = json.reference || json.referenceNumber;
        } catch (e) {
            console.error("Failed to parse JSON webhook", e);
        }
    } else {
        const params = new URLSearchParams(text);
        pollUrl = params.get("pollurl");
        reference = params.get("reference");
    }

    if (!pollUrl || !reference) {
      return new NextResponse("Missing pollurl or reference", { status: 400 });
    }

    const pesepay = getPesepay();
    
    // Verify status from Pesepay directly
    const response = await pesepay.pollTransaction(pollUrl);

    if (response.paid) {
      // Parse reference: OrgID | TierID/Type | Qty/Timestamp
      const parts = reference.split("|");
      if (parts.length < 2) {
        console.error("Invalid reference format:", reference);
        return new NextResponse("Invalid reference format", { status: 400 });
      }

      const [orgId, typeOrTier, param3] = parts;

      const org = await db.organization.findUnique({
        where: { id: orgId },
      });

      if (!org) {
        return new NextResponse("Organization not found", { status: 404 });
      }

      // Handle Credit Purchase
      if (typeOrTier === "CREDIT") {
         const qty = parseInt(param3 || "1", 10);
         
         await db.organization.update({
            where: { id: orgId },
            data: {
                credits: { increment: qty },
                paynowPollUrl: null
            }
         });
         
         // Log Purchase
         await db.auditLog.create({
            data: {
                organizationId: orgId,
                action: "PURCHASE_CREDIT",
                status: "SUCCESS",
                metadata: { quantity: qty, gateway: "PESEPAY" }
            }
         });

         console.log(`Credits (${qty}) added for Org ${orgId}`);

      } else if (typeOrTier === "EXTRA_CLIENT") {
          // Handle Extra Client Slot
          await db.organization.update({
              where: { id: orgId },
              data: {
                  extraClientSlots: { increment: 1 },
                  paynowPollUrl: null
              }
          });

          await db.auditLog.create({
            data: {
                organizationId: orgId,
                action: "UPDATE_SETTINGS", // Or similar
                status: "SUCCESS",
                metadata: { description: "Purchased Extra Client Slot", gateway: "PESEPAY" }
            }
         });
         console.log(`Extra Client Slot added for Org ${orgId}`);

      } else {
         // Handle Subscription Purchase (Standard)
          const tierId = typeOrTier;
          const plan = getPlanById(tierId);
          
          if (!plan) {
            console.error("Unknown plan in reference:", tierId);
            return new NextResponse("Unknown plan", { status: 400 });
          }

          // Calculate new end date
          let newEndDate = new Date();
          // If currently active and not expired, add to existing end date
          if (org.subscriptionEndsAt && org.subscriptionEndsAt > new Date()) {
            newEndDate = new Date(org.subscriptionEndsAt);
          }

          if (plan.period === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          } else {
            // Monthly
            newEndDate.setDate(newEndDate.getDate() + 30);
          }

          await db.organization.update({
            where: { id: orgId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionTier: tierId,
              subscriptionEndsAt: newEndDate,
              gracePeriodEndsAt: null, // Clear grace period
              paynowPollUrl: null, // Clear poll URL as it's processed
            },
          });

          console.log(`Subscription activated for Org ${orgId} - Tier ${tierId}`);
      }
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
