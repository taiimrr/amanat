import type { PrismaClient, Role, AuditAction } from '@prisma/client'

interface LogParams {
  prisma: PrismaClient
  actorId: string
  actorRole: Role
  action: AuditAction
  entityType: string
  entityId: string
  payload: Record<string, unknown>
}

/**
 * Append-only audit log writer.
 * ALWAYS pass the active Prisma transaction client when inside a transaction.
 * This ensures the audit entry and the business operation are atomic.
 */
export async function logAction({
  prisma,
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  payload,
}: LogParams): Promise<void> {
  await (prisma as PrismaClient).auditLog.create({
    data: {
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      payload,
    },
  })
}
