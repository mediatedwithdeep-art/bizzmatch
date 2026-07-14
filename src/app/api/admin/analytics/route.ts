import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, requireAdmin } from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/cache";

type Analytics = {
  totals: {
    users: number;
    activeProfiles: number;
    verifiedProfiles: number;
    connections: number;
    messages: number;
    swipes: number;
    openReports: number;
  };
  last7d: { signups: number; swipes: number; matches: number; messages: number };
  topIndustries: { industry: string; count: number }[];
  generatedAt: string;
};

/** Platform analytics for the admin dashboard. Cached for 60s. */
export const GET = handler(async () => {
  await requireAdmin();

  const cached = cacheGet<Analytics>("analytics");
  if (cached) return NextResponse.json(cached);

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [
    users,
    activeProfiles,
    verifiedProfiles,
    connections,
    messages,
    swipes,
    openReports,
    signups7,
    swipes7,
    matches7,
    messages7,
    industries,
  ] = await Promise.all([
    db.user.count(),
    db.businessProfile.count({ where: { status: { in: ["ACTIVE", "VERIFIED"] } } }),
    db.businessProfile.count({ where: { status: "VERIFIED" } }),
    db.connection.count(),
    db.message.count(),
    db.swipe.count(),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.swipe.count({ where: { createdAt: { gte: weekAgo } } }),
    db.connection.count({ where: { createdAt: { gte: weekAgo } } }),
    db.message.count({ where: { createdAt: { gte: weekAgo } } }),
    db.businessProfile.groupBy({
      by: ["industry"],
      _count: { industry: true },
      orderBy: { _count: { industry: "desc" } },
      take: 5,
    }),
  ]);

  const data: Analytics = {
    totals: { users, activeProfiles, verifiedProfiles, connections, messages, swipes, openReports },
    last7d: { signups: signups7, swipes: swipes7, matches: matches7, messages: messages7 },
    topIndustries: industries.map((i) => ({ industry: i.industry, count: i._count.industry })),
    generatedAt: new Date().toISOString(),
  };
  cacheSet("analytics", data, 60_000);
  return NextResponse.json(data);
});
