import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updatePlanSchema = z.object({
  planId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = updatePlanSchema.parse(body);

    // Update the organization's subscription tier
    // Note: In a real app, you might want to validate if the user is allowed to switch plans (e.g. check if trial is valid)
    // But for this requirement, we allow selecting the plan for the trial.
    
    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        subscriptionTier: planId,
        // We do NOT update subscriptionStatus or trialEndsAt here, as we assume they are already in TRIAL mode.
        // If we wanted to "Start" the trial here, we could set trialEndsAt to now + 3 days if it wasn't set.
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
