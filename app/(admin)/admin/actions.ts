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

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Prevent self-deactivation
  if (session.user.id === userId) {
      return { success: false, error: "You cannot deactivate yourself." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus }
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle user status:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Prevent self-deletion
  if (session.user.id === userId) {
    return { success: false, error: "You cannot delete yourself." };
  }

  try {
    // Delete audit logs first to avoid foreign key issues
    await db.auditLog.deleteMany({
        where: { userId }
    });

    await db.user.delete({
      where: { id: userId }
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
