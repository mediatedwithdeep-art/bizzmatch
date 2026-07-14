import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireActiveMember } from "@/lib/api";
import { parsePagination, targetSchema } from "@/lib/validators";

/** Saved (bookmarked) profiles, newest first. Paginated: ?limit=&cursor= */
export const GET = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { limit, cursor } = parsePagination(new URL(req.url));

  const rows = await db.savedProfile.findMany({
    where: { ownerId: session.sub },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      target: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { companyName: true, industry: true, country: true, city: true, status: true },
          },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return NextResponse.json({
    saved: page.map((r) => ({
      id: r.id,
      savedAt: r.createdAt,
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
  if (targetUserId === session.sub) return jsonError("You cannot save your own profile", 400);

  const target = await db.businessProfile.findUnique({ where: { userId: targetUserId } });
  if (!target) return jsonError("Business not found", 404);

  await db.savedProfile.upsert({
    where: { ownerId_targetId: { ownerId: session.sub, targetId: targetUserId } },
    create: { ownerId: session.sub, targetId: targetUserId },
    update: {},
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const { targetUserId } = await parseBody(req, targetSchema);
  await db.savedProfile.deleteMany({ where: { ownerId: session.sub, targetId: targetUserId } });
  return NextResponse.json({ ok: true });
});
