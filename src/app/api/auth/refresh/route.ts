import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { handler, jsonError } from "@/lib/api";
import { establishSession } from "@/lib/auth";
import { REFRESH_COOKIE, type Role } from "@/lib/constants";
import { consumeToken, TOKEN_TYPE } from "@/lib/tokens";

/**
 * Rotate the refresh token: consume the presented one (single use) and issue
 * a fresh access + refresh pair. A reused/expired token yields 401 and the
 * client must log in again.
 */
export const POST = handler(async () => {
  const store = await cookies();
  const raw = store.get(REFRESH_COOKIE)?.value;
  if (!raw) return jsonError("No refresh token", 401);

  const userId = await consumeToken(raw, TOKEN_TYPE.REFRESH);
  if (!userId) return jsonError("Session expired — please sign in again", 401);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) return jsonError("Session expired — please sign in again", 401);

  await establishSession({ sub: user.id, role: user.role as Role });
  return NextResponse.json({ ok: true });
});
