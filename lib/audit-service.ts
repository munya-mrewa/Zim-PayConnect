import { db } from "@/lib/db";
import { AuditAction, AuditStatus, Prisma } from "@prisma/client";
import { sendSlackAlert } from "@/lib/notifications";

export class AuditService {
  /**
   * Updates an organization and logs the action.
   */
  static async updateOrganization(
    userId: string,
    organizationId: string,
    data: Prisma.OrganizationUpdateInput,
    ipAddress?: string
  ) {
    return await db.$transaction(async (tx) => {
      // 1. Perform the update
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data,
      });

      // 2. Log the audit event
      await tx.auditLog.create({
        data: {
          userId,
          organizationId,
          action: AuditAction.UPDATE_SETTINGS,
          status: AuditStatus.SUCCESS,
          ipAddress,
          metadata: {
            updatedFields: Object.keys(data),
            // We avoid logging the full 'data' object if it contains sensitive info, 
            // but for settings, listing the keys is usually safe and helpful.
          },
        },
      });

      return updatedOrg;
    });
  }

  /**
   * Logs a generic action (e.g., Login, Report Generation) without a data update.
   */
  static async logAction(
    userId: string,
    organizationId: string,
    action: AuditAction,
    status: AuditStatus,
    metadata?: any,
    ipAddress?: string
  ) {
    if (status === AuditStatus.FAILURE) {
        const errorMsg = metadata?.error || "Unknown error";
        await sendSlackAlert(
            `🚨 **Audit Failure**\nAction: ${action}\nOrg: ${organizationId}\nUser: ${userId}\nError: ${errorMsg}`, 
            "ERROR"
        );
    }

    return await db.auditLog.create({
      data: {
        userId,
        organizationId,
        action,
        status,
        metadata,
        ipAddress,
      },
    });
  }
}
