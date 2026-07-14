import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireAdmin } from "@/lib/api";
import { parsePagination } from "@/lib/validators";

/** User directory for admins. ?q= searches email/name/company. Paginated. */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const { limit, cursor } = parsePagination(url, 25, 100);

  const rows = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { profile: { companyName: { contains: q } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      suspendedAt: true,
      emailVerifiedAt: true,
      createdAt: true,
      profile: { select: { companyName: true, industry: true, country: true, city: true, status: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    users: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
