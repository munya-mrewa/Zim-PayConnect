"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { settingsSchema, SettingsValues, taxSettingsSchema, TaxSettingsValues, passwordChangeSchema, PasswordChangeValues } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";

export async function updateOrganization(data: SettingsValues) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.organizationId) {
      return { error: "Unauthorized" };
    }

    const validatedFields = settingsSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid fields", details: validatedFields.error.flatten() };
    }

    const { name, tin, contactEmail, address } = validatedFields.data;

    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name,
        tin,
        contactEmail,
        address,
      },
    });

    // Also update Audit Log
    await db.auditLog.create({
        data: {
            organizationId: session.user.organizationId,
            userId: session.user.id,
            action: "UPDATE_SETTINGS",
            status: "SUCCESS",
            metadata: { changes: { name, tin } } // Pass object directly for Postgres
        }
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

    const validatedFields = taxSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid fields", details: validatedFields.error.flatten() };
    }

    const { 
        defaultCurrency, nssaEnabled, nssaRate, nssaCeilingUSD, nssaCeilingZiG, 
        necEnabled, necRate, sdfEnabled, sdfRate,
        autoUpdateRates, currentExchangeRate
    } = validatedFields.data;

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
        currentExchangeRate: currentExchangeRate ? Number(currentExchangeRate) : undefined
      },
    });

    await db.auditLog.create({
        data: {
            organizationId: session.user.organizationId,
            userId: session.user.id,
            action: "UPDATE_SETTINGS",
            status: "SUCCESS",
            metadata: { type: "TAX_CONFIG_CHANGE" }
        }
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
        await db.auditLog.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                action: "UPDATE_SETTINGS",
                status: "SUCCESS",
                metadata: { type: "PASSWORD_CHANGE" }
            }
        });
    }

    return { success: "Password updated successfully." };

  } catch (error) {
    console.error("Password update error:", error);
    return { error: "Failed to update password." };
  }
}
