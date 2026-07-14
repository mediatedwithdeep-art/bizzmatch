import { z } from "zod";
import { INDUSTRIES } from "./constants";

// Indian tax/identity formats — used by the (optional) verification framework.
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const websiteField = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v), "Enter a valid URL (https://…)")
  .optional()
  .transform((v) => (v ? v : null));

/** Simplified signup: account + minimum company facts. Straight to dashboard. */
export const signupSchema = z.object({
  name: z.string().trim().min(2, "Your name is required").max(80),
  email,
  password,
  companyName: z.string().trim().min(2, "Company name is required").max(120),
  industry: z.enum(INDUSTRIES, { message: "Pick an industry" }),
  country: z.string().trim().min(2, "Country is required").max(60),
  city: z.string().trim().min(2, "City is required").max(60),
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Password is required") });

export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(10), password });

/** Everything beyond signup is optional profile enrichment. */
export const profileUpdateSchema = z.object({
  companyName: z.string().trim().min(2).max(120).optional(),
  industry: z.enum(INDUSTRIES).optional(),
  country: z.string().trim().min(2).max(60).optional(),
  city: z.string().trim().min(2).max(60).optional(),
  state: optionalText(60),
  about: optionalText(600),
  products: optionalText(600),
  goals: optionalText(400),
  size: optionalText(40),
  website: websiteField,
});

/** Future verification framework (VERIFICATION_ENABLED=true). */
export const verificationSchema = z.object({
  gstin: z.string().trim().toUpperCase().regex(GSTIN_REGEX, "Enter a valid 15-character GSTIN"),
  pan: z.string().trim().toUpperCase().regex(PAN_REGEX, "Enter a valid 10-character PAN"),
  aadhaar: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/\s/g, "") : v),
    z.string().regex(AADHAAR_REGEX, "Enter a valid 12-digit Aadhaar number"),
  ),
});

export const swipeSchema = z.object({
  targetUserId: z.string().min(1),
  direction: z.enum(["INTERESTED", "SKIP"]),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

export const adminDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(400).optional(),
});

export const reportSchema = z.object({
  targetUserId: z.string().min(1),
  reason: z.enum(["SPAM", "FAKE_BUSINESS", "INAPPROPRIATE", "SCAM", "OTHER"]),
  detail: z.string().trim().max(600).optional(),
});

export const reportResolveSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
});

export const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export const targetSchema = z.object({ targetUserId: z.string().min(1) });

/** Shared pagination query parsing: ?limit=&cursor= (cursor = last row id). */
export function parsePagination(url: URL, defaultLimit = 20, maxLimit = 50) {
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? `${defaultLimit}`, 10) || defaultLimit, 1),
    maxLimit,
  );
  const cursor = url.searchParams.get("cursor") || undefined;
  return { limit, cursor };
}
