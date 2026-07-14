import { createHash, timingSafeEqual } from "crypto";

/**
 * One-way hash for government IDs (Aadhaar). We never store the raw number —
 * only a salted digest (enough to detect the same ID being reused across
 * accounts) plus the last 4 digits for display.
 */
export function hashGovernmentId(id: string): string {
  const salt = process.env.ID_HASH_SALT ?? "dev-only-salt";
  return createHash("sha256").update(`${salt}:${id}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
