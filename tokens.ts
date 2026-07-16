import { createHash, randomBytes } from "crypto";
import { db } from "./db";

export const TOKEN_TYPE = {
  REFRESH: "REFRESH",
  EMAIL_VERIFY: "EMAIL_VERIFY",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;
export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

const TTL_MS: Record<TokenType, number> = {
  REFRESH: 30 * 24 * 3600_000, // 30 days
  EMAIL_VERIFY: 48 * 3600_000, // 48 hours
  PASSWORD_RESET: 30 * 60_000, // 30 minutes
};

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Mint a token: raw value goes to the client, only the hash is stored. */
export async function issueToken(userId: string, type: TokenType): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.authToken.create({
    data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + TTL_MS[type]) },
  });
  return raw;
}

/**
 * Consume a token (single use). Returns the owning userId or null.
 * Refresh tokens are rotated by the caller issuing a new one after this.
 */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  const token = await db.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) return null;
  await db.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return token.userId;
}

/** Revoke all live tokens of a type for a user (logout-everywhere, reset). */
export async function revokeTokens(userId: string, type: TokenType): Promise<void> {
  await db.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
}
