import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler, jsonError, parseBody } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueToken, TOKEN_TYPE } from "@/lib/tokens";
import { resetPasswordMessage, sendMail } from "@/lib/mailer";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";

/** Always responds 200 — never reveals whether the email exists. */
export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  if (!rateLimit(`forgot:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts, try again in a minute", 429);
  }

  const { email } = await parseBody(req, forgotPasswordSchema);
  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const token = await issueToken(user.id, TOKEN_TYPE.PASSWORD_RESET);
    const link = `${env.APP_URL}/reset-password?token=${token}`;
    const msg = resetPasswordMessage(user.name, link);
    sendMail(email, msg.subject, msg.text).catch(() => {});
    await audit("auth.password_reset_requested", { actorId: user.id, ip });
  }

  return NextResponse.json({
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  });
});
