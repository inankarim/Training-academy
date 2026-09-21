import { getPool } from '../database/postgres';
import { logger } from './logger';

export interface AuditLogInput {
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await getPool().query(
      `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.actorUserId ?? null,
        input.action,
        input.targetType ?? null,
        input.targetId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
    );
  } catch (err) {
    // Audit logging must never crash the primary request flow — log the
    // failure loudly so it's visible in monitoring, but don't throw.
    logger.error('Failed to write audit log', {
      action: input.action,
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
}
