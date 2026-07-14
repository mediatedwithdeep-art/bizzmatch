import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, handler, parseBody, requireActiveMember } from "@/lib/api";
import { messageSchema } from "@/lib/validators";
import { NOTIFICATION_TYPE } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

async function requireParticipant(connectionId: string, userId: string) {
  const connection = await db.connection.findUnique({ where: { id: connectionId } });
  if (!connection || (connection.userAId !== userId && connection.userBId !== userId)) {
    throw new ApiError("Connection not found", 404);
  }
  return connection;
}

/** Chat history plus the other party's profile header. Supports ?after=<iso> for polling. */
export const GET = handler(async (req: Request, { params }: Ctx) => {
  const session = await requireActiveMember();
  const { id } = await params;
  const connection = await requireParticipant(id, session.sub);

  const url = new URL(req.url);
  const after = url.searchParams.get("after");

  const messages = await db.message.findMany({
    where: {
      connectionId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  const otherId = connection.userAId === session.sub ? connection.userBId : connection.userAId;
  const other = await db.businessProfile.findUnique({
    where: { userId: otherId },
    select: { companyName: true, industry: true, city: true, user: { select: { name: true } } },
  });

  return NextResponse.json({
    me: session.sub,
    other: other
      ? {
          companyName: other.companyName,
          ownerName: other.user.name,
          industry: other.industry,
          city: other.city,
        }
      : null,
    messages,
  });
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  const session = await requireActiveMember();
  const { id } = await params;
  const connection = await requireParticipant(id, session.sub);

  if (!rateLimit(`msg:${session.sub}`, 30, 60_000)) {
    throw new ApiError("You are sending messages too quickly", 429);
  }

  const { body } = await parseBody(req, messageSchema);
  const message = await db.message.create({
    data: { connectionId: id, senderId: session.sub, body },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  const otherId = connection.userAId === session.sub ? connection.userBId : connection.userAId;
  const sender = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { companyName: true },
  });
  // Notify the recipient only if they don't already have an unread message
  // notification for this chat — avoids flooding the bell during a conversation.
  const alreadyNotified = await db.notification.findFirst({
    where: { userId: otherId, type: NOTIFICATION_TYPE.MESSAGE, href: `/chat/${id}`, read: false },
    select: { id: true },
  });
  if (!alreadyNotified) {
    await db.notification.create({
      data: {
        userId: otherId,
        type: NOTIFICATION_TYPE.MESSAGE,
        title: "New message",
        body: `${sender?.companyName ?? "A connection"} sent you a message.`,
        href: `/chat/${id}`,
      },
    });
  }

  return NextResponse.json({ message }, { status: 201 });
});
