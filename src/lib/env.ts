import { z } from "zod";

/**
 * Environment validation — imported by lib/db and lib/auth so it runs before
 * any request handling. Fails fast in production, warns + falls back in dev.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  ID_HASH_SALT: z.string().min(16).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  VERIFICATION_ENABLED: z.enum(["true", "false"]).default("false"),
  // SMTP (optional): when unset, emails are logged instead of sent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration — ${issues}`);
}

export const env = parsed.data;

// Deliberately NOT thrown here: this module is imported by every API route,
// and Next.js imports route modules at build time to analyze them (even
// though it never invokes the handlers then). Throwing eagerly would fail
// `next build` whenever AUTH_SECRET isn't set yet — including in CI/CD
// pipelines that set it only at deploy time. The real check is lazy, inside
// lib/jwt.ts's getSecret(), which only runs when a request actually signs
// or verifies a session token. Likewise the DATABASE_URL check is lazy —
// Prisma surfaces a clear "not ready" error at query time (handled in lib/api).

export const isProduction = env.NODE_ENV === "production";
export const verificationEnabled = env.VERIFICATION_ENABLED === "true";
