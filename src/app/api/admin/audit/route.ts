import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireAdmin } from "@/lib/api";
import { parsePagination } from "@/lib/validators";

/** Audit trail. ?action= filters by prefix (e.g. auth., admin.). Paginated. */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const action = url.searchParams.get("action")?.trim();
  const { limit, cursor } = parsePagination(url, 50, 200);

  const rows = await db.auditLog.findMany({
    where: action ? { action: { startsWith: action } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actor: { select: { email: true } } },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    logs: page.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor?.email ?? null,
      targetId: l.targetId,
      meta: l.meta ? JSON.parse(l.meta) : null,
      ip: l.ip,
      createdAt: l.createdAt,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
