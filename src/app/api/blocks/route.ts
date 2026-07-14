import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireActiveMember } from "@/lib/api";
import { targetSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

/** Blocking hides both parties from each other everywhere (discover, search, chat). */
export const POST = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { targetUserId } = await parseBody(req, targetSchema);
  if (targetUserId === session.sub) return jsonError("You cannot block yourself", 400);

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return jsonError("User not found", 404);

  await db.block.upsert({
    where: { blockerId_targetId: { blockerId: session.sub, targetId: targetUserId } },
    create: { blockerId: session.sub, targetId: targetUserId },
    update: {},
  });
  // Sever existing relationships both ways.
  await Promise.all([
    db.follow.deleteMany({
      where: {
        OR: [
          { followerId: session.sub, targetId: targetUserId },
          { followerId: targetUserId, targetId: session.sub },
        ],
      },
    }),
    db.savedProfile.deleteMany({
      where: {
        OR: [
          { ownerId: session.sub, targetId: targetUserId },
          { ownerId: targetUserId, targetId: session.sub },
        ],
      },
    }),
  ]);
  await audit("user.block", { actorId: session.sub, targetId: targetUserId });
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { targetUserId } = await parseBody(req, targetSchema);
  await db.block.deleteMany({ where: { blockerId: session.sub, targetId: targetUserId } });
  await audit("user.unblock", { actorId: session.sub, targetId: targetUserId });
  return NextResponse.json({ ok: true });
});

export const GET = handler(async () => {
  const session = await requireActiveMember();
  const blocks = await db.block.findMany({
    where: { blockerId: session.sub },
    include: {
      target: { select: { id: true, name: true, profile: { select: { companyName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    blocked: blocks.map((b) => ({
      userId: b.target.id,
      ownerName: b.target.name,
      companyName: b.target.profile?.companyName ?? null,
      blockedAt: b.createdAt,
    })),
  });
});
