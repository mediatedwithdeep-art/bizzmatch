import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  handler,
  isBlockedEitherWay,
  jsonError,
  parseBody,
  requireActiveMember,
} from "@/lib/api";
import { parsePagination, targetSchema } from "@/lib/validators";
import { NOTIFICATION_TYPE } from "@/lib/constants";

/** Who I follow, newest first. Paginated. */
export const GET = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { limit, cursor } = parsePagination(new URL(req.url));

  const rows = await db.follow.findMany({
    where: { followerId: session.sub },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      target: {
        select: {
          id: true,
          name: true,
          profile: { select: { companyName: true, industry: true, city: true, status: true } },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    following: page.map((r) => ({
      id: r.id,
      userId: r.target.id,
      ownerName: r.target.name,
      ...r.target.profile,
      verified: r.target.profile?.status === "VERIFIED",
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

export const POST = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { targetUserId } = await parseBody(req, targetSchema);
  if (targetUserId === session.sub) return jsonError("You cannot follow yourself", 400);
  if (await isBlockedEitherWay(session.sub, targetUserId)) {
    return jsonError("Business not found", 404);
  }

  const target = await db.businessProfile.findUnique({
    where: { userId: targetUserId },
    select: { companyName: true },
  });
  if (!target) return jsonError("Business not found", 404);

  const existing = await db.follow.findUnique({
    where: { followerId_targetId: { followerId: session.sub, targetId: targetUserId } },
  });
  if (!existing) {
    const me = await db.businessProfile.findUnique({
      where: { userId: session.sub },
      select: { companyName: true },
    });
    await db.follow.create({ data: { followerId: session.sub, targetId: targetUserId } });
    await db.notification.create({
      data: {
        userId: targetUserId,
        type: NOTIFICATION_TYPE.FOLLOW,
        title: "New follower",
        body: `${me?.companyName ?? "A business"} started following ${target.companyName}.`,
        href: null,
      },
    });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { targetUserId } = await parseBody(req, targetSchema);
  await db.follow.deleteMany({ where: { followerId: session.sub, targetId: targetUserId } });
  return NextResponse.json({ ok: true });
});
