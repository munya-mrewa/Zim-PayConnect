import { db } from "@/lib/db";
import { AuditAction, AuditStatus } from "@prisma/client";

interface CreateAuditLogParams {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  status: AuditStatus;
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      return await db.auditLog.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId,
          action: params.action,
          status: params.status,
          fileName: params.fileName,
          fileSize: params.fileSize,
          recordCount: params.recordCount,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Return null or undefined if creation fails, but don't throw to avoid blocking
      return null;
    }
  }

  static async getLogs(organizationId: string, limit = 50, offset = 0) {
    return await db.auditLog.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }
}
