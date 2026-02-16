import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPesepay } from "@/lib/pesepay";
import { getPlanById, PAY_PER_PROCESS_COST } from "@/lib/config/pricing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { tierId, type, amount } = body; // type: 'SUBSCRIPTION' | 'CREDIT'

    let paymentItemName = "";
    let paymentAmount = 0;
    let referenceType = "";
    let referenceSuffix = "";

    if (type === 'CREDIT') {
        const qty = parseInt(amount || "1", 10);
        if (qty < 1) {
             return new NextResponse("Invalid amount", { status: 400 });
        }
        paymentItemName = `${qty} Report Credit${qty > 1 ? 's' : ''}`;
        paymentAmount = qty * PAY_PER_PROCESS_COST;
        referenceType = "CREDIT";
        referenceSuffix = qty.toString();
    } else {
        // Default to subscription
        if (!tierId) {
             return new NextResponse("Tier ID is required for subscriptions", { status: 400 });
        }
        const plan = getPlanById(tierId);
        if (!plan) {
             return new NextResponse("Invalid Tier ID", { status: 400 });
        }
        paymentItemName = `Subscription: ${plan.name}`;
        paymentAmount = plan.price;
        referenceType = tierId;
        referenceSuffix = Date.now().toString();
    }

    // Fetch user and organization to ensure security
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId || !user.organization) {
      return new NextResponse("User is not associated with an organization", { status: 400 });
    }

    const organization = user.organization;
    const pesepay = getPesepay();
    
    // Config URLs
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    pesepay.returnUrl = `${appUrl}/dashboard?payment=success`;
    
    // Pesepay requires a publicly accessible URL for the webhook (resultUrl).
    if (appUrl.includes("localhost")) {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`; // Localhost usually fails, but keeping structure.
        console.warn("Using Localhost for Pesepay Result URL. Webhooks likely won't be received without tunnel.");
    } else {
        pesepay.resultUrl = `${appUrl}/api/webhooks/pesepay`;
    }
    
    // Create payment
    // Reference Format: OrgID | Type/Tier | Qty/Timestamp
    const reference = `${organization.id}|${referenceType}|${referenceSuffix}`;
    
    // Pesepay createTransaction
    // createTransaction(amount: number, currencyCode: string, paymentReason: string, merchantReference?: string)
    const transaction = pesepay.createTransaction(paymentAmount, "USD", paymentItemName, reference);

    // Initiate transaction
    console.log(`Initiating payment (${referenceType})...`);
    const response = await pesepay.initiateTransaction(transaction);
    console.log("Pesepay Response:", JSON.stringify(response, null, 2));

    if (response.success) {
      // Save pollUrl to DB
      await db.organization.update({
        where: { id: organization.id },
        data: {
          paynowPollUrl: response.pollUrl,
        },
      });

      return NextResponse.json({ redirectUrl: response.redirectUrl });
    } else {
      console.error("Pesepay Error:", response.message);
      return NextResponse.json({ error: "Payment initiation failed", details: response.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}
