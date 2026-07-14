import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, isBlockedEitherWay, jsonError, requireSession } from "@/lib/api";
import { PROFILE_STATUS } from "@/lib/constants";
import { completenessScore } from "@/lib/completeness";

type Ctx = { params: Promise<{ userId: string }> };

/** Public company page (for signed-in members). Includes social context. */
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const session = await requireSession();
  const { userId } = await params;

  if (await isBlockedEitherWay(session.sub, userId)) {
    return jsonError("Company not found", 404);
  }

  const profile = await db.businessProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, emailVerifiedAt: true, suspendedAt: true } } },
  });
  if (!profile || profile.status === PROFILE_STATUS.SUSPENDED || profile.user.suspendedAt) {
    return jsonError("Company not found", 404);
  }

  const [followers, saved, following] = await Promise.all([
    db.follow.count({ where: { targetId: userId } }),
    db.savedProfile.findFirst({
      where: { ownerId: session.sub, targetId: userId },
      select: { id: true },
    }),
    db.follow.findFirst({
      where: { followerId: session.sub, targetId: userId },
      select: { id: true },
    }),
  ]);

  const { aadhaarHash: _h, aadhaarLast4: _l, gstin: _g, pan: _p, user, ...safe } = profile;
  return NextResponse.json({
    company: {
      ...safe,
      ownerName: user.name,
      verified: profile.status === PROFILE_STATUS.VERIFIED,
      completeness: completenessScore(profile, Boolean(user.emailVerifiedAt)).score,
    },
    social: { followers, savedByMe: Boolean(saved), followedByMe: Boolean(following) },
  });
});
