"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { settingsSchema, SettingsValues, taxSettingsSchema, TaxSettingsValues, passwordChangeSchema, PasswordChangeValues } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";

import { AuditService } from "@/lib/audit-service";
import { AuditAction, AuditStatus } from "@prisma/client";
import { headers } from "next/headers";
import { requireActiveSubscription } from "@/lib/auth/subscription";

export async function updateOrganization(data: SettingsValues) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.organizationId) {
      return { error: "Unauthorized" };
    }

    // Enforcement
    await requireActiveSubscription(session.user.organizationId);

    const validatedFields = settingsSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid fields", details: validatedFields.error.flatten() };
    }

    const { name, tin, contactEmail, address, nssaNumber, necNumber } = validatedFields.data;
    const headerList = await headers();
    const ip = headerList.get("x-client-ip") || "unknown";

    // Perform the database update
    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name,
        tin,
        contactEmail,
        address,
        nssaNumber,
        necNumber,
      },
    });

    // Log the audit event
    await AuditService.log({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: AuditAction.UPDATE_SETTINGS,
      status: AuditStatus.SUCCESS,
      metadata: {
        updatedFields: Object.keys(validatedFields.data),
        context: "Organization Profile"
      },
      ipAddress: ip
    });

    revalidatePath("/settings");
    return { success: "Organization profile updated." };

  } catch (error) {
    console.error("Settings update error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function updateTaxSettings(data: TaxSettingsValues) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.organizationId) {
      return { error: "Unauthorized" };
    }

    // Enforcement
    await requireActiveSubscription(session.user.organizationId);

    const validatedFields = taxSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid fields", details: validatedFields.error.flatten() };
    }

    const { 
        defaultCurrency, nssaEnabled, nssaRate, nssaCeilingUSD, nssaCeilingZiG, 
        necEnabled, necRate, sdfEnabled, sdfRate,
        autoUpdateRates, currentExchangeRate,
        accountingFormat,
    } = validatedFields.data;

    const headerList = await headers();
    const ip = headerList.get("x-client-ip") || "unknown";

    // Perform the database update
    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        defaultCurrency,
        nssaEnabled,
        nssaRate,
        nssaCeilingUSD,
        nssaCeilingZiG,
        necEnabled,
        necRate,
        sdfEnabled,
        sdfRate,
        autoUpdateRates: autoUpdateRates ?? false,
        currentExchangeRate: currentExchangeRate ? Number(currentExchangeRate) : undefined,
        accountingFormat: accountingFormat || "STANDARD",
      },
    });

    // Log the audit event
    await AuditService.log({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: AuditAction.UPDATE_SETTINGS,
      status: AuditStatus.SUCCESS,
      metadata: {
        updatedFields: Object.keys(validatedFields.data),
        context: "Tax Settings"
      },
      ipAddress: ip
    });

    revalidatePath("/settings");
    return { success: "Tax configuration updated." };

  } catch (error) {
    console.error("Tax settings update error:", error);
    return { error: "Something went wrong." };
  }
}

export async function updatePassword(data: PasswordChangeValues) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = passwordChangeSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten() };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // 1. Get User to check password
    const user = await db.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user || !user.hashedPassword) {
        return { error: "User not found or external account." };
    }

    // 2. Verify current password
    const isPasswordValid = await compare(currentPassword, user.hashedPassword);

    if (!isPasswordValid) {
        return { error: "Incorrect current password." };
    }

    // 3. Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // 4. Update DB
    await db.user.update({
        where: { id: session.user.id },
        data: { hashedPassword }
    });

    // 5. Audit
    if (user.organizationId) {
        const headerList = await headers();
        const ip = headerList.get("x-client-ip") || "unknown";

        await AuditService.log({
            organizationId: user.organizationId,
            userId: user.id,
            action: AuditAction.UPDATE_SETTINGS,
            status: AuditStatus.SUCCESS,
            metadata: { type: "PASSWORD_CHANGE" },
            ipAddress: ip
        });
    }

    return { success: "Password updated successfully." };

  } catch (error) {
    console.error("Password update error:", error);
    return { error: "Failed to update password." };
  }
}
