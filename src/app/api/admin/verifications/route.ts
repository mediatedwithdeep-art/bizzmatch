import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireAdmin } from "@/lib/api";
import { PROFILE_STATUS } from "@/lib/constants";
import { parsePagination } from "@/lib/validators";

/** Verification queue. ?status=PENDING_VERIFICATION|VERIFIED (default pending). */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status")?.toUpperCase() ?? PROFILE_STATUS.PENDING_VERIFICATION;
  const status = (Object.values(PROFILE_STATUS) as string[]).includes(statusParam)
    ? statusParam
    : PROFILE_STATUS.PENDING_VERIFICATION;
  const { limit, cursor } = parsePagination(url, 25, 100);

  const rows = await db.businessProfile.findMany({
    where: { status },
    include: { user: { select: { email: true, name: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  // Aadhaar hash is internal — expose only last4 to the admin UI.
  const safe = page.map(({ aadhaarHash: _hash, ...rest }) => rest);
  return NextResponse.json({
    applications: safe,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
