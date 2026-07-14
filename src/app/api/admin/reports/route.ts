import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireAdmin } from "@/lib/api";
import { parsePagination } from "@/lib/validators";
import { REPORT_STATUS } from "@/lib/constants";

/** Report queue. ?status=OPEN|RESOLVED|DISMISSED (default OPEN), paginated. */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status")?.toUpperCase() ?? REPORT_STATUS.OPEN;
  const status = (Object.values(REPORT_STATUS) as string[]).includes(statusParam)
    ? statusParam
    : REPORT_STATUS.OPEN;
  const { limit, cursor } = parsePagination(url);

  const rows = await db.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      reporter: { select: { email: true, profile: { select: { companyName: true } } } },
      target: { select: { id: true, email: true, profile: { select: { companyName: true } } } },
    },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    reports: page.map((r) => ({
      id: r.id,
      reason: r.reason,
      detail: r.detail,
      status: r.status,
      createdAt: r.createdAt,
      reporter: { email: r.reporter.email, company: r.reporter.profile?.companyName },
      target: { userId: r.target.id, email: r.target.email, company: r.target.profile?.companyName },
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
