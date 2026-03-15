import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPesepay } from "@/lib/pesepay";
import { getPlanById } from "@/lib/config/pricing";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { getPostHog } from "@/lib/posthog-node";
import { sendSlackAlert } from "@/lib/notifications";

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
            logger.error({ err: e }, "Failed to parse JSON webhook");
        }
    } else {
        const params = new URLSearchParams(text);
        pollUrl = params.get("pollurl");
        reference = params.get("reference");
    }

    if (!pollUrl || !reference) {
      return new NextResponse("Missing pollurl or reference", { status: 400 });
    }

    // Webhook Idempotency Check
    const existingTx = await db.paymentTransaction.findUnique({
      where: { reference },
    });

    if (existingTx?.status === "PAID") {
      logger.info({ reference }, "Webhook idempotency: transaction already processed and PAID");
      return new NextResponse("OK", { status: 200 });
    }

    // Security check: ensure pollUrl is actually pointing to Pesepay domain
    try {
        const urlObj = new URL(pollUrl);
        if (process.env.NODE_ENV === "production" && urlObj.hostname !== "api.pesepay.com") {
             logger.error({ pollUrl }, "Invalid pollUrl hostname for Pesepay webhook");
             return new NextResponse("Invalid pollurl", { status: 400 });
        }
    } catch (e) {
        logger.error({ err: e, pollUrl }, "Invalid pollUrl format");
        return new NextResponse("Invalid pollurl", { status: 400 });
    }

    const pesepay = getPesepay();
    
    // Verify status from Pesepay directly
    const response = await pesepay.pollTransaction(pollUrl);

    if (response.paid) {
      // Parse reference: OrgID | TierID/Type | Qty/Timestamp
      const parts = reference.split("|");
      if (parts.length < 2) {
        logger.error({ reference }, "Invalid reference format");
        return new NextResponse("Invalid reference format", { status: 400 });
      }

      const [orgId, typeOrTier, param3] = parts;
      const posthog = getPostHog();

      const org = await db.organization.findUnique({
        where: { id: orgId },
      });

      if (!org) {
        return new NextResponse("Organization not found", { status: 404 });
      }

      // Track successful payment in PostHog
      posthog?.capture({
          distinctId: orgId,
          event: 'payment_success',
          properties: {
              reference,
              type: typeOrTier,
              param: param3,
              organizationName: org.name,
              gateway: 'PESEPAY'
          }
      });
      // Ensure event is sent before webhook response
      posthog?.shutdown();

      let description = "";
      let transactionType = typeOrTier;

      // Handle Credit Purchase
      if (typeOrTier === "CREDIT") {
         const qty = parseInt(param3 || "1", 10);
         description = `Purchased ${qty} Processing Credits`;
         
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

         logger.info(`Credits (${qty}) added for Org ${orgId}`);

      } else if (typeOrTier === "EXTRA_CLIENT") {
          description = "Purchased 1 Extra Client Slot";
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
                metadata: { description, gateway: "PESEPAY" }
            }
         });
         logger.info(`Extra Client Slot added for Org ${orgId}`);

      } else {
         // Handle Subscription Purchase (Standard)
          transactionType = "SUBSCRIPTION";
          const tierId = typeOrTier;
          const plan = getPlanById(tierId);
          
          if (!plan) {
            logger.error({ tierId }, "Unknown plan in reference");
            return new NextResponse("Unknown plan", { status: 400 });
          }

          description = `Subscription to ${plan.name} Plan`;

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

          logger.info(`Subscription activated for Org ${orgId} - Tier ${tierId}`);
      }

      // Record Transaction for Idempotency and Invoicing
      await db.paymentTransaction.upsert({
        where: { reference },
        update: { status: "PAID", description },
        create: {
          reference,
          organizationId: orgId,
          status: "PAID",
          type: transactionType,
          description,
        }
      });

      // Alert Revenue
      await sendSlackAlert(
        `💰 **Payment Received**\nAmount: (Check Dashboard)\nRef: ${reference}\nItem: ${description}\nOrg: ${orgId}`,
        "SUCCESS"
      );

      // Send Invoice/Receipt Email
      if (org.contactEmail) {
         try {
            await sendEmail({
               to: org.contactEmail,
               subject: `Payment Receipt: ${description}`,
               html: `
                 <h2>Payment Successful</h2>
                 <p>Thank you for your payment.</p>
                 <p><strong>Item:</strong> ${description}</p>
                 <p><strong>Reference:</strong> ${reference}</p>
                 <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                 <br />
                 <p>You can download your PDF receipt from the Billing section of your dashboard.</p>
               `
            });
         } catch (e) {
            logger.error({ err: e, orgId }, "Failed to send receipt email");
         }
      }
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    logger.error({ err: error }, "Webhook Error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
