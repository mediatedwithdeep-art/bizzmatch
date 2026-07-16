import { NextResponse } from "next/server";
import { ZodError, type ZodType, type ZodTypeDef } from "zod";
import { getSession, type SessionPayload } from "./auth";
import { db } from "./db";
import { ADMIN_ROLES, PROFILE_STATUS, ROLES, type Role } from "./constants";
import { log } from "./logger";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Wrap a route handler: auth/validation errors become clean JSON responses. */
export function handler<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return jsonError(err.message, err.status);
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return jsonError(first?.message ?? "Invalid input", 400, {
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }
      const message = err instanceof Error ? err.message : "";
      log.error("unhandled api error", { err: message || String(err) });
      if (message.includes("AUTH_SECRET")) return jsonError(message, 500);
      if (
        message.includes("DATABASE_URL") ||
        message.includes("does not exist in the current database") ||
        message.includes("no such table") ||
        message.includes("Can't reach database server") ||
        message.includes("Error querying the database")
      ) {
        return jsonError(
          "Database is not ready. Run `npx prisma db push` (and check DATABASE_URL), then try again.",
          500,
        );
      }
      return jsonError("Something went wrong", 500);
    }
  };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError("Not authenticated", 401);
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new ApiError("Insufficient permissions", 403);
  return session;
}

export const requireAdmin = () => requireRole(...ADMIN_ROLES);
export const requireSuperAdmin = () => requireRole(ROLES.SUPER_ADMIN);

/** Members need an active (non-suspended) profile to use the network. */
export async function requireActiveMember(): Promise<SessionPayload> {
  const session = await requireSession();
  const profile = await db.businessProfile.findUnique({
    where: { userId: session.sub },
    select: { status: true },
  });
  if (!profile) throw new ApiError("Complete your company details first", 403);
  if (profile.status === PROFILE_STATUS.SUSPENDED) {
    throw new ApiError("Your account is suspended. Contact support.", 403);
  }
  return session;
}

export async function parseBody<T>(
  req: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
  return schema.parse(raw);
}

/** Canonical ordering for a connection pair so (a,b) and (b,a) collide. */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** True when either side has blocked the other. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const block = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: a, targetId: b },
        { blockerId: b, targetId: a },
      ],
    },
    select: { id: true },
  });
  return Boolean(block);
}

/** IDs blocked by or blocking the given user — excluded from all discovery. */
export async function blockedUserIds(userId: string): Promise<string[]> {
  const blocks = await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { targetId: userId }] },
    select: { blockerId: true, targetId: true },
  });
  return blocks.map((b) => (b.blockerId === userId ? b.targetId : b.blockerId));
}
