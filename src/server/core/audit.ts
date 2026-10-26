import { prisma } from "@/lib/db";

export interface LogAuditOptions {
  actorId?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export async function recordAuditLog(options: LogAuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId,
        actorRole: options.actorRole,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        ipAddress: options.ipAddress,
        detailsJson: options.details ? JSON.stringify(options.details) : null,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error]", error);
  }
}
