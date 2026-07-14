import { cookies } from "next/headers";
import {
  REFRESH_COOKIE,
  REFRESH_TTL_SECONDS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./constants";
import { createSessionToken, verifySessionToken, type SessionPayload } from "./jwt";
import { issueToken, TOKEN_TYPE } from "./tokens";

export { createSessionToken, verifySessionToken, type SessionPayload };

/** Read + verify the access token from the request cookie. Null when logged out. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

const cookieBase = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

/**
 * Establish a full session: short-lived JWT access cookie plus a rotating
 * refresh token (hashed at rest, single-use, 30-day) scoped to /api/auth.
 */
export async function establishSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(payload), {
    ...cookieBase,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  const refresh = await issueToken(payload.sub, TOKEN_TYPE.REFRESH);
  store.set(REFRESH_COOKIE, refresh, {
    ...cookieBase,
    path: "/api/auth",
    maxAge: REFRESH_TTL_SECONDS,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/api/auth", maxAge: 0 });
}

/** Back-compat aliases used by older call sites. */
export const setSessionCookie = establishSession;
export const clearSessionCookie = clearSessionCookies;
