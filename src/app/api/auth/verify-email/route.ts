import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handler } from "@/lib/api";
import { consumeToken, TOKEN_TYPE } from "@/lib/tokens";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";

/** Email-verification link target. Redirects into the app with a status flag. */
export const GET = handler(async (req: Request) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = token ? await consumeToken(token, TOKEN_TYPE.EMAIL_VERIFY) : null;

  if (!userId) {
    return NextResponse.redirect(`${env.APP_URL}/profile?emailVerified=expired`);
  }

  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  await audit("auth.email_verified", { actorId: userId });
  return NextResponse.redirect(`${env.APP_URL}/profile?emailVerified=1`);
});
