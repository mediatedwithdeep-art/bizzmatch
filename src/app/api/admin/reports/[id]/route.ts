import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { reportResolveSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/** Resolve or dismiss a report. */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const session = await requireAdmin();
  const { id } = await params;
  const { status } = await parseBody(req, reportResolveSchema);

  const report = await db.report.findUnique({ where: { id } });
  if (!report) return jsonError("Report not found", 404);
  if (report.status !== "OPEN") return jsonError("This report is already closed", 409);

  await db.report.update({ where: { id }, data: { status, resolvedAt: new Date() } });
  await audit("admin.report.resolve", {
    actorId: session.sub,
    targetId: report.targetId,
    meta: { reportId: id, status },
  });
  return NextResponse.json({ ok: true });
});
