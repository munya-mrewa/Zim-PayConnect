import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPesepay } from "@/lib/pesepay";

// Hardcoded Credit Pricing for MVP
const CREDIT_PRICE = 5.00; // $5 per credit

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quantity } = await req.json();
    const qty = quantity || 1;

    if (qty < 1) {
       return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    
    // Verify user belongs to org
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { organization: true }
    });

    if (!user || !user.organizationId) {
        return NextResponse.json({ error: "Organization required" }, { status: 403 });
    }

    const orgId = user.organizationId;
    const amount = qty * CREDIT_PRICE;
    
    // Reference Format: OrgID | CREDIT | QTY | Timestamp
    // We use "CREDIT" as a keyword for the webhook to detect
    const reference = `${orgId}|CREDIT|${qty}|${Date.now()}`;

    const pesepay = getPesepay();
    
    // Config URLs
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    pesepay.returnUrl = `${appUrl}/dashboard?payment=success`;
    
    if (appUrl.includes("localhost")) {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`; // Placeholder
    } else {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`;
    }

    const transaction = pesepay.createTransaction(amount, "USD", `Pay-Per-Process Credits (${qty})`, reference);

    const response = await pesepay.initiateTransaction(transaction);

    if (response.success) {
      await db.organization.update({
        where: { id: orgId },
        data: { paynowPollUrl: response.pollUrl },
      });

      return NextResponse.json({ redirectUrl: response.redirectUrl });
    } else {
      return NextResponse.json({ error: "Pesepay Error", details: response.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Credit Purchase Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
