"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";

export type ClientData = {
  id?: string;
  name: string;
  tin?: string | null;
  email?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
};

async function getOrganization() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });

  if (!user?.organization) {
    throw new Error("Organization not found");
  }

  return user.organization;
}

export async function getClients() {
  const org = await getOrganization();

  const clients = await db.client.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: clients };
}

export async function getClient(id: string) {
  const org = await getOrganization();

  const client = await db.client.findFirst({
    where: { id, organizationId: org.id },
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  return { success: true, data: client };
}

export async function createClient(data: ClientData) {
  try {
    const org = await getOrganization();

    // Check Plan Limits
    const planId = (org.subscriptionTier as SubscriptionPlanId) || "MICRO";
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

    if (!plan) {
        throw new Error("Invalid subscription plan");
    }

    const currentClientCount = await db.client.count({
      where: { organizationId: org.id },
    });

    // Enterprise check - Unlimited
    if (org.subscriptionTier === 'ENTERPRISE') {
         // Proceed
    } else {
        const maxClients = plan.maxClientTins || 0;
        const extraSlots = org.extraClientSlots || 0;
        const totalLimit = maxClients + extraSlots;

        if (currentClientCount >= totalLimit) {
          return {
            success: false,
            error: `Plan limit reached. Your ${plan.name} plan allows ${totalLimit} clients. Please purchase extra slots.`
          };
        }
    }

    const client = await db.client.create({
      data: {
        organizationId: org.id,
        name: data.name,
        tin: data.tin,
        email: data.email,
        address: data.address,
        phoneNumber: data.phoneNumber,
      },
    });

    revalidatePath("/clients");
    return { success: true, data: client };
  } catch (error: any) {
    console.error("Failed to create client:", error);
    // Handle unique constraint violation for TIN
    if (error.code === 'P2002') {
        return { success: false, error: "A client with this TIN already exists." };
    }
    return { success: false, error: error.message || "Failed to create client" };
  }
}

export async function updateClient(id: string, data: ClientData) {
  try {
    const org = await getOrganization();

    // Verify ownership
    const existingClient = await db.client.findFirst({
        where: { id, organizationId: org.id }
    });

    if (!existingClient) {
        return { success: false, error: "Client not found" };
    }

    const client = await db.client.update({
      where: { id },
      data: {
        name: data.name,
        tin: data.tin,
        email: data.email,
        address: data.address,
        phoneNumber: data.phoneNumber,
      },
    });

    revalidatePath("/clients");
    return { success: true, data: client };
  } catch (error: any) {
     if (error.code === 'P2002') {
        return { success: false, error: "A client with this TIN already exists." };
    }
    return { success: false, error: error.message || "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    const org = await getOrganization();

    // Verify ownership
    const existingClient = await db.client.findFirst({
        where: { id, organizationId: org.id }
    });
    
    if (!existingClient) {
        return { success: false, error: "Client not found" };
    }

    await db.client.delete({
      where: { id },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete client" };
  }
}
