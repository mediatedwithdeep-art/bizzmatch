import { PrismaClient } from "@prisma/client";
import "./env"; // validates configuration and applies the SQLite dev fallback

// Reuse a single client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
