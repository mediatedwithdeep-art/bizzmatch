import { db } from "./db";
import { log } from "./logger";

/** Append to the audit trail. Never throws — auditing must not break requests. */
export async function audit(
  action: string,
  opts: { actorId?: string; targetId?: string; meta?: Record<string, unknown>; ip?: string } = {},
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        actorId: opts.actorId,
        targetId: opts.targetId,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
        ip: opts.ip,
      },
    });
  } catch (err) {
    log.error("audit write failed", { action, err: String(err) });
  }
}
