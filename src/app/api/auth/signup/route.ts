import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody } from "@/lib/api";
import { signupSchema } from "@/lib/validators";
import { establishSession } from "@/lib/auth";
import { PROFILE_STATUS, ROLES } from "@/lib/constants";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueToken, TOKEN_TYPE } from "@/lib/tokens";
import { sendMail, verifyEmailMessage } from "@/lib/mailer";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";

/**
 * Simplified signup: account + minimum company facts, auto-approved,
 * lands on the dashboard immediately. Email verification is async and
 * non-blocking.
 */
export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  if (!rateLimit(`signup:${ip}`, 10, 60_000)) {
    return jsonError("Too many attempts, try again in a minute", 429);
  }

  const data = await parseBody(req, signupSchema);

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return jsonError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: ROLES.USER,
      profile: {
        create: {
          companyName: data.companyName,
          industry: data.industry,
          country: data.country,
          city: data.city,
          status: PROFILE_STATUS.ACTIVE,
        },
      },
    },
  });

  await establishSession({ sub: user.id, role: ROLES.USER });

  // Non-blocking email verification (improves completeness score when done).
  const token = await issueToken(user.id, TOKEN_TYPE.EMAIL_VERIFY);
  const link = `${env.APP_URL}/api/auth/verify-email?token=${token}`;
  const msg = verifyEmailMessage(data.name, link);
  sendMail(data.email, msg.subject, msg.text).catch(() => {});

  await audit("auth.signup", { actorId: user.id, ip, meta: { email: data.email } });

  return NextResponse.json({ next: "/discover" }, { status: 201 });
});
