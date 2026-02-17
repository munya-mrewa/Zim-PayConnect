import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPesepay } from "@/lib/pesepay";
import { SUBSCRIPTION_PLANS } from "@/lib/config/pricing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, orgId } = await req.json();

    if (!orgId) {
       return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }
    
    // Verify user belongs to org
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { organization: true }
    });

    if (!user) {
        console.error("User not found in DB");
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.organizationId !== orgId) {
        console.error(`Forbidden Access: User Org (${user.organizationId}) !== Request Org (${orgId})`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });
    }

    const reference = `${orgId}|${planId}|${Date.now()}`;

    const pesepay = getPesepay();
    
    // Config URLs
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    pesepay.returnUrl = `${appUrl}/dashboard?payment=success`;
    
    // Pesepay requires a publicly accessible URL for the webhook (resultUrl).
    if (appUrl.includes("localhost")) {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`; // Placeholder
        console.warn("Using placeholder Result URL for Pesepay (Localhost detected). Webhooks will not be received.");
    } else {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`;
    }

    const transaction = pesepay.createTransaction(plan.price, "USD", `Subscription: ${plan.name}`, reference);

    const response = await pesepay.initiateTransaction(transaction);

    if (response.success) {
      // Save poll URL to DB
      await db.organization.update({
        where: { id: orgId },
        data: {
          paynowPollUrl: response.pollUrl,
          // We don't update status yet, we wait for webhook or poll
        },
      });

      return NextResponse.json({ redirectUrl: response.redirectUrl });
    } else {
      return NextResponse.json({ error: "Pesepay Error", details: response.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Payment Initiation Error:", error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'pesepay_error.log');
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${errorMessage}\n`);
    } catch (logError) {
      console.error("Failed to write error log:", logError);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
