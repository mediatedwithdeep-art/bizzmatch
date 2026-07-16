export const ROLES = { USER: "USER", ADMIN: "ADMIN", SUPER_ADMIN: "SUPER_ADMIN" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ADMIN_ROLES: Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const PROFILE_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
} as const;
export type ProfileStatus = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

export const SWIPE_DIRECTION = { INTERESTED: "INTERESTED", SKIP: "SKIP" } as const;
export type SwipeDirection = (typeof SWIPE_DIRECTION)[keyof typeof SWIPE_DIRECTION];

export const NOTIFICATION_TYPE = {
  MATCH: "MATCH",
  MESSAGE: "MESSAGE",
  VERIFICATION_APPROVED: "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED: "VERIFICATION_REJECTED",
  FOLLOW: "FOLLOW",
  SYSTEM: "SYSTEM",
} as const;

export const REPORT_STATUS = { OPEN: "OPEN", RESOLVED: "RESOLVED", DISMISSED: "DISMISSED" } as const;

export const INDUSTRIES = [
  "Agriculture",
  "Automotive",
  "Construction & Real Estate",
  "Consulting",
  "E-commerce",
  "Education",
  "Finance & Insurance",
  "Food & Beverage",
  "Healthcare & Pharma",
  "Hospitality & Travel",
  "IT & Software",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Marketing & Media",
  "Retail & Wholesale",
  "Textiles & Apparel",
  "Other",
] as const;

export const SESSION_COOKIE = "bm_session";
export const REFRESH_COOKIE = "bm_refresh";
export const SESSION_TTL_SECONDS = 60 * 15; // access token: 15 minutes
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // refresh: 30 days
