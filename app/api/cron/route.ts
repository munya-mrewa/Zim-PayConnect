import { NextResponse } from "next/server";
import { checkExpiringSubscriptions } from "@/lib/cron/subscription-reminder";

export async function GET(req: Request) {
  // Simple authorization check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await checkExpiringSubscriptions();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Cron Job Failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
