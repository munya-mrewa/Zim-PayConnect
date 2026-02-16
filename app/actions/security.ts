"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleTwoFactor(enabled: boolean) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: enabled },
    });

    // Audit Log
    if (session.user.organizationId) {
        await db.auditLog.create({
            data: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
                action: "UPDATE_SETTINGS",
                status: "SUCCESS",
                metadata: { type: "2FA_TOGGLE", enabled }
            }
        });
    }

    revalidatePath("/settings");
    return { success: enabled ? "2FA Enabled" : "2FA Disabled" };
  } catch (error) {
    console.error("2FA Toggle Error:", error);
    return { error: "Failed to update security settings." };
  }
}
