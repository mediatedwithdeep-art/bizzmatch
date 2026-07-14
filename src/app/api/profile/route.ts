import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody, requireSession } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validators";
import { completenessScore } from "@/lib/completeness";
import { cacheDelete } from "@/lib/cache";

export const GET = handler(async () => {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      profile: true,
    },
  });
  if (!user) return jsonError("Account not found", 404);

  const completeness = user.profile
    ? completenessScore(user.profile, Boolean(user.emailVerifiedAt))
    : { score: 0, missing: ["Company details"] };

  const { aadhaarHash: _hash, ...profile } = user.profile ?? ({} as never);
  return NextResponse.json({
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    profile: user.profile ? profile : null,
    completeness,
  });
});

/** Create the company profile (legacy accounts that predate simplified signup). */
export const POST = handler(async (req: Request) => {
  const session = await requireSession();
  const data = await parseBody(
    req,
    profileUpdateSchema.required({ companyName: true, industry: true, country: true, city: true }),
  );

  const existing = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (existing) return jsonError("Profile already exists — use PUT to edit", 409);

  await db.businessProfile.create({
    data: {
      userId: session.sub,
      companyName: data.companyName,
      industry: data.industry,
      country: data.country,
      city: data.city,
      state: data.state ?? null,
      about: data.about ?? null,
      products: data.products ?? null,
      goals: data.goals ?? null,
      website: data.website ?? null,
      size: data.size ?? null,
    },
  });
  return NextResponse.json({ next: "/discover" }, { status: 201 });
});

/** Edit the business profile. All enrichment fields are optional. */
export const PUT = handler(async (req: Request) => {
  const session = await requireSession();
  const data = await parseBody(req, profileUpdateSchema);

  const existing = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!existing) return jsonError("Complete signup first", 400);

  // Strip undefined keys so partial updates don't null-out fields.
  const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await db.businessProfile.update({ where: { userId: session.sub }, data: updates });
  cacheDelete("discover:"); // profile facts feed the recommendation cache
  return NextResponse.json({ ok: true });
});
