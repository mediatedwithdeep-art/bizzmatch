import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireAdmin, requireSuperAdmin } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { revokeTokens, TOKEN_TYPE } from "@/lib/tokens";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  suspended: z.boolean().optional(),
});

/**
 * Admin user management. Suspension: any admin. Role changes: super admin only.
 * Nobody can modify a super admin except another super admin, and you cannot
 * change your own role or suspend yourself.
 */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const session = await requireAdmin();
  const { id } = await params;
  const { role, suspended } = await parseBody(req, patchSchema);

  if (id === session.sub) return jsonError("You cannot modify your own account here", 400);

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return jsonError("User not found", 404);
  if (target.role === ROLES.SUPER_ADMIN && session.role !== ROLES.SUPER_ADMIN) {
    return jsonError("Insufficient permissions", 403);
  }

  if (role !== undefined) {
    await requireSuperAdmin();
    await db.user.update({ where: { id }, data: { role } });
    await audit("admin.user.role", { actorId: session.sub, targetId: id, meta: { role } });
  }

  if (suspended !== undefined) {
    await db.user.update({
      where: { id },
      data: { suspendedAt: suspended ? new Date() : null },
    });
    if (suspended) await revokeTokens(id, TOKEN_TYPE.REFRESH);
    await audit(suspended ? "admin.user.suspend" : "admin.user.unsuspend", {
      actorId: session.sub,
      targetId: id,
    });
  }

  return NextResponse.json({ ok: true });
});
