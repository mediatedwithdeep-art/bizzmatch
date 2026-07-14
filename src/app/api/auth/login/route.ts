import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { establishSession } from "@/lib/auth";
import { ADMIN_ROLES, type Role } from "@/lib/constants";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return jsonError("Too many attempts, try again in a minute", 429);
  }

  const { email, password } = await parseBody(req, loginSchema);

  const user = await db.user.findUnique({
    where: { email },
    include: { profile: { select: { status: true } } },
  });
  // Same error for unknown email vs wrong password — don't leak which.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await audit("auth.login_failed", { ip, meta: { email } });
    return jsonError("Invalid email or password", 401);
  }
  if (user.suspendedAt) {
    return jsonError("This account is suspended. Contact support.", 403);
  }

  await establishSession({ sub: user.id, role: user.role as Role });
  await audit("auth.login", { actorId: user.id, ip });

  const next = (ADMIN_ROLES as string[]).includes(user.role)
    ? "/admin"
    : user.profile
      ? "/discover"
      : "/onboarding";
  return NextResponse.json({ next });
});
