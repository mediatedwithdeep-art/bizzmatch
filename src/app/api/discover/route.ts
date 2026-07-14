import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blockedUserIds, handler, jsonError, requireActiveMember } from "@/lib/api";
import { PROFILE_STATUS } from "@/lib/constants";
import { rankCandidates } from "@/lib/recommend";

const CARD_SELECT = {
  userId: true,
  companyName: true,
  industry: true,
  country: true,
  city: true,
  state: true,
  about: true,
  products: true,
  goals: true,
  website: true,
  status: true,
  createdAt: true,
  user: { select: { name: true } },
} as const;

/**
 * The swipe deck: active businesses the user hasn't swiped, ranked by the
 * recommendation engine. Filters: ?industry=&city=&country=&q=&limit=
 */
export const GET = handler(async (req: Request) => {
  const session = await requireActiveMember();
  const url = new URL(req.url);
  const industry = url.searchParams.get("industry")?.trim();
  const city = url.searchParams.get("city")?.trim();
  const country = url.searchParams.get("country")?.trim();
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 50);

  const viewer = await db.businessProfile.findUnique({ where: { userId: session.sub } });
  if (!viewer) return jsonError("Complete your company details first", 403);

  const [swiped, blocked] = await Promise.all([
    db.swipe.findMany({ where: { swiperId: session.sub }, select: { targetId: true } }),
    blockedUserIds(session.sub),
  ]);
  const excluded = [session.sub, ...swiped.map((s) => s.targetId), ...blocked];

  const candidates = await db.businessProfile.findMany({
    where: {
      status: { in: [PROFILE_STATUS.ACTIVE, PROFILE_STATUS.VERIFIED] },
      userId: { notIn: excluded },
      user: { suspendedAt: null },
      ...(industry ? { industry } : {}),
      ...(city ? { city: { contains: city } } : {}),
      ...(country ? { country: { contains: country } } : {}),
      ...(q
        ? {
            OR: [
              { companyName: { contains: q } },
              { about: { contains: q } },
              { products: { contains: q } },
              { goals: { contains: q } },
            ],
          }
        : {}),
    },
    select: CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take: 120, // candidate pool for ranking
  });

  const ranked = rankCandidates(viewer, candidates).slice(0, limit);
  const profiles = ranked.map(({ user, status, ...rest }) => ({
    ...rest,
    ownerName: user.name,
    verified: status === PROFILE_STATUS.VERIFIED,
  }));

  return NextResponse.json({ profiles });
});
