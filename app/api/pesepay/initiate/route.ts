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

    const { planId, orgId, type, quantity } = await req.json();

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

    let amount = 0;
    let description = "";
    let reference = "";

    if (type === "EXTRA_CLIENT") {
        amount = 15;
        description = "Extra Client Slot (Agency)";
        reference = `${orgId}|EXTRA_CLIENT|${Date.now()}`;
    } else if (type === "CREDIT") {
        amount = 5 * (quantity || 1); // $5 per credit
        description = `Pay-Per-Process Credits (${quantity || 1})`;
        reference = `${orgId}|CREDIT|${quantity || 1}`;
    } else {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
        if (!plan) {
          return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });
        }
        amount = plan.price;
        description = `Subscription: ${plan.name}`;
        reference = `${orgId}|${planId}|${Date.now()}`;
    }

    const pesepay = getPesepay();
    
    // Config URLs
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    pesepay.returnUrl = `${appUrl}/dashboard?payment=success`;
    
    if (appUrl.includes("localhost")) {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`; 
        console.warn("Using placeholder Result URL for Pesepay (Localhost detected). Webhooks will not be received.");
    } else {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`;
    }

    const transaction = pesepay.createTransaction(amount, "USD", description, reference);

    const response = await pesepay.initiateTransaction(transaction);

    if (response.success) {
      // Save poll URL to DB
      await db.organization.update({
        where: { id: orgId },
        data: {
          paynowPollUrl: response.pollUrl,
        },
      });

      return NextResponse.json({ redirectUrl: response.redirectUrl });
    } else {
      return NextResponse.json({ error: "Pesepay Error", details: response.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Payment Initiation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
