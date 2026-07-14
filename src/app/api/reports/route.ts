import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireActiveMember } from "@/lib/api";
import { reportSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

/** File a report against a business. Reviewed in the admin dashboard. */
export const POST = handler(async (req: Request) => {
  const session = await requireActiveMember();
  if (!rateLimit(`report:${session.sub}`, 5, 3_600_000)) {
    return jsonError("You have filed too many reports recently", 429);
  }

  const { targetUserId, reason, detail } = await parseBody(req, reportSchema);
  if (targetUserId === session.sub) return jsonError("You cannot report yourself", 400);

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return jsonError("User not found", 404);

  const report = await db.report.create({
    data: { reporterId: session.sub, targetId: targetUserId, reason, detail: detail ?? null },
  });
  await audit("user.report", {
    actorId: session.sub,
    targetId: targetUserId,
    meta: { reason, reportId: report.id },
  });
  return NextResponse.json({ ok: true, reportId: report.id }, { status: 201 });
});
