import { NextResponse } from "next/server";
import { clearSessionCookies, getSession } from "@/lib/auth";
import { handler } from "@/lib/api";
import { revokeTokens, TOKEN_TYPE } from "@/lib/tokens";
import { audit } from "@/lib/audit";

export const POST = handler(async () => {
  const session = await getSession();
  if (session) {
    await revokeTokens(session.sub, TOKEN_TYPE.REFRESH);
    await audit("auth.logout", { actorId: session.sub });
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
});
