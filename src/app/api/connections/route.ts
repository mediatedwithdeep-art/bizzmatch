import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blockedUserIds, handler, requireActiveMember } from "@/lib/api";
import { parsePagination } from "@/lib/validators";

const profileSelect = {
  userId: true,
  companyName: true,
  industry: true,
  country: true,
  city: true,
  state: true,
  status: true,
} as const;

/** Connections with the other party's profile and latest message. Paginated. */
export const GET = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { limit, cursor } = parsePagination(new URL(req.url), 20, 50);
  const blocked = await blockedUserIds(session.sub);

  const connections = await db.connection.findMany({
    where: {
      OR: [{ userAId: session.sub }, { userBId: session.sub }],
      NOT: [{ userAId: { in: blocked } }, { userBId: { in: blocked } }],
    },
    include: {
      userA: { select: { name: true, profile: { select: profileSelect } } },
      userB: { select: { name: true, profile: { select: profileSelect } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = connections.length > limit;
  const page = connections.slice(0, limit);
  const result = page.map((c) => {
    const otherUser = c.userAId === session.sub ? c.userB : c.userA;
    const last = c.messages[0];
    return {
      id: c.id,
      createdAt: c.createdAt,
      other: otherUser.profile
        ? { ...otherUser.profile, ownerName: otherUser.name, verified: otherUser.profile.status === "VERIFIED" }
        : null,
      lastMessage: last
        ? { body: last.body, createdAt: last.createdAt, mine: last.senderId === session.sub }
        : null,
    };
  });

  return NextResponse.json({
    connections: result,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
