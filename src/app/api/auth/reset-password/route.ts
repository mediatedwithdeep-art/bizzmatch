import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken, revokeTokens, TOKEN_TYPE } from "@/lib/tokens";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  if (!rateLimit(`reset:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts, try again in a minute", 429);
  }

  const { token, password } = await parseBody(req, resetPasswordSchema);
  const userId = await consumeToken(token, TOKEN_TYPE.PASSWORD_RESET);
  if (!userId) return jsonError("This reset link is invalid or has expired", 400);

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  // Password change invalidates every live session.
  await revokeTokens(userId, TOKEN_TYPE.REFRESH);
  await audit("auth.password_reset", { actorId: userId, ip });

  return NextResponse.json({ ok: true, message: "Password updated — sign in with it now." });
});
