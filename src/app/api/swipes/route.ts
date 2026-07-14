import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  handler,
  isBlockedEitherWay,
  jsonError,
  orderPair,
  parseBody,
  requireActiveMember,
} from "@/lib/api";
import { swipeSchema } from "@/lib/validators";
import { NOTIFICATION_TYPE, PROFILE_STATUS, SWIPE_DIRECTION } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Record a swipe. A mutual INTERESTED creates the connection (chat unlock)
 * and notifies both parties.
 */
export const POST = handler(async (req: Request) => {
  const session = await requireActiveMember();
  if (!rateLimit(`swipe:${session.sub}`, 60, 60_000)) {
    return jsonError("Slow down a little — try again in a minute", 429);
  }

  const { targetUserId, direction } = await parseBody(req, swipeSchema);
  if (targetUserId === session.sub) return jsonError("You cannot swipe on yourself", 400);
  if (await isBlockedEitherWay(session.sub, targetUserId)) {
    return jsonError("This business is not available", 404);
  }

  const target = await db.businessProfile.findUnique({
    where: { userId: targetUserId },
    select: { status: true, companyName: true },
  });
  if (!target || target.status === PROFILE_STATUS.SUSPENDED) {
    return jsonError("This business is not available", 404);
  }

  await db.swipe.upsert({
    where: { swiperId_targetId: { swiperId: session.sub, targetId: targetUserId } },
    create: { swiperId: session.sub, targetId: targetUserId, direction },
    update: { direction },
  });

  if (direction !== SWIPE_DIRECTION.INTERESTED) return NextResponse.json({ match: false });

  const reciprocal = await db.swipe.findUnique({
    where: { swiperId_targetId: { swiperId: targetUserId, targetId: session.sub } },
  });
  if (reciprocal?.direction !== SWIPE_DIRECTION.INTERESTED) {
    return NextResponse.json({ match: false });
  }

  const [userAId, userBId] = orderPair(session.sub, targetUserId);
  const existing = await db.connection.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) return NextResponse.json({ match: true, connectionId: existing.id });

  const me = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { companyName: true },
  });

  const connection = await db.connection.create({ data: { userAId, userBId } });
  await db.notification.createMany({
    data: [
      {
        userId: session.sub,
        type: NOTIFICATION_TYPE.MATCH,
        title: "New connection!",
        body: `You and ${target.companyName} are now connected. Start the conversation.`,
        href: `/chat/${connection.id}`,
      },
      {
        userId: targetUserId,
        type: NOTIFICATION_TYPE.MATCH,
        title: "New connection!",
        body: `You and ${me?.companyName ?? "a business"} are now connected. Start the conversation.`,
        href: `/chat/${connection.id}`,
      },
    ],
  });

  return NextResponse.json({
    match: true,
    connectionId: connection.id,
    matchedCompany: target.companyName,
  });
});
