import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireSession } from "@/lib/api";
import { parsePagination } from "@/lib/validators";

/** Notifications, newest first. Paginated: ?limit=&cursor= */
export const GET = handler(async (req: Request) => {
  const session = await requireSession();
  const { limit, cursor } = parsePagination(new URL(req.url), 25, 50);

  const [rows, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    db.notification.count({ where: { userId: session.sub, read: false } }),
  ]);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    notifications: page,
    unread,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

/** Mark all as read. */
export const PATCH = handler(async () => {
  const session = await requireSession();
  await db.notification.updateMany({
    where: { userId: session.sub, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
});
