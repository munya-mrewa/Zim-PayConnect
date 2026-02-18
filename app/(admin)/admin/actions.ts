"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateAccountManager(orgId: string, managerId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT_AGENT")) {
    throw new Error("Unauthorized");
  }

  try {
    // If managerId is "null" or empty, we disconnect the manager
    if (!managerId || managerId === "unassigned") {
        await db.organization.update({
            where: { id: orgId },
            data: { accountManagerId: null }
        });
    } else {
        await db.organization.update({
            where: { id: orgId },
            data: { accountManagerId: managerId }
        });
    }
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update account manager:", error);
    return { success: false, error: "Failed to update account manager" };
  }
}
