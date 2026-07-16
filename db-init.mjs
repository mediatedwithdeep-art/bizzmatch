// Prepares the database before dev/build.
//  - Local: generates a .env with secrets on first run (you still add DATABASE_URL).
//  - Vercel/CI: reads DATABASE_URL + secrets from real environment variables.
//  - Syncs the Prisma schema (creates tables) and seeds demo data when empty.
// It never resets or wipes an existing database — safe to run on every deploy.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const onManagedHost = Boolean(process.env.VERCEL || process.env.CI);
const ENV_PATH = ".env";

// 1. Local convenience only: create a .env with strong secrets on first run.
//    On Vercel/CI, secrets come from the dashboard env vars — never a file.
if (!onManagedHost && !existsSync(ENV_PATH)) {
  const secret = randomBytes(48).toString("base64");
  const salt = randomBytes(32).toString("base64");
  writeFileSync(
    ENV_PATH,
    [
      "# Add your Postgres connection string here (Neon/Supabase/etc.):",
      '# DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"',
      'DATABASE_URL=""',
      `AUTH_SECRET="${secret}"`,
      `ID_HASH_SALT="${salt}"`,
      'APP_URL="http://localhost:3000"',
      'VERIFICATION_ENABLED="false"',
      'LOG_LEVEL="info"',
      "",
    ].join("\n"),
  );
  console.log("Created .env with generated secrets — now add your DATABASE_URL to it.");
}

// 2. Load .env (local) so this standalone script sees the same vars Next.js would.
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
}

// 3. No database configured → don't block the build. The app runs and shows a
//    clear "set DATABASE_URL" message at runtime instead of failing to compile.
if (!process.env.DATABASE_URL) {
  console.warn(
    "\n⚠  DATABASE_URL is not set — skipping database setup.\n" +
      "   Add a Postgres URL (locally in .env, on Vercel in Settings → Environment Variables).\n" +
      "   See DEPLOY.md for the 2-minute Neon walkthrough.\n",
  );
  process.exit(0);
}

const run = (args) =>
  spawnSync("npx", args, { stdio: "inherit", env: process.env, shell: process.platform === "win32" });

// 4. Create/update tables to match the schema. Non-destructive: db push only
//    adds what's missing. (No --force-reset — that would wipe production data.)
const push = run(["prisma", "db", "push", "--skip-generate"]);
if (push.status !== 0) {
  console.error("prisma db push failed — check that DATABASE_URL is correct and reachable.");
  process.exit(push.status ?? 1);
}

// 5. Seed demo data only when the database is empty (idempotent, safe to re-run).
try {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const users = await db.user.count().catch(() => -1);
  await db.$disconnect();
  if (users === 0) {
    console.log("Empty database — loading demo businesses and admin accounts…");
    run(["tsx", "prisma/seed.ts"]);
  }
} catch {
  // Seeding is a convenience; never block startup on it.
}
