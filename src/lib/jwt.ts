// Edge-safe JWT primitives (no database imports) — used by middleware and lib/auth.
import { SignJWT, jwtVerify } from "jose";
import { SESSION_TTL_SECONDS, type Role } from "./constants";

export type SessionPayload = {
  sub: string; // user id
  role: Role;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Server is not configured: set the AUTH_SECRET environment variable (any long random string) and restart/redeploy.",
      );
    }
    return new TextEncoder().encode("insecure-dev-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}
