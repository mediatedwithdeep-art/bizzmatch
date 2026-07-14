# How to run & deploy BizMatch

BizMatch runs on **PostgreSQL** (Neon, Supabase, Vercel Postgres, or any
Postgres). You need a connection string (`DATABASE_URL`) both locally and on
Vercel. Quick fix guide: see **FIX-DATABASE.txt**.

## Run on your computer

1. Get a free Postgres URL from https://neon.tech (sign in with GitHub →
   create project → copy the connection string).
2. Create a file named `.env` in the project root:

   ```
   DATABASE_URL="postgresql://...your Neon URL...?sslmode=require"
   AUTH_SECRET="any-long-random-string-40-plus-chars"
   ID_HASH_SALT="another-long-random-string"
   APP_URL="http://localhost:3000"
   ```

3. Then:

   ```bash
   npm install
   npm run preview     # builds, creates tables, seeds demo data, starts on :3000
   ```

   Use `npm run dev` instead while editing code (live reload).

Demo logins (created automatically on first run):
- Member: `deep@bizmatch.demo` · password `Deep@1234`
- Admin: `deepsolanki0174@gmail.com` · password `Deep@1234`
- Or `priya@textilehub.demo` · password `demo1234`

## Open it on your phone (same WiFi)

`localhost` only works on the computer itself. From a phone:

1. Find your computer's IP — Windows: `ipconfig` (IPv4 Address); Mac/Linux: `ifconfig`
2. On the phone open: `http://YOUR-IP:3000` (e.g. `http://192.168.1.5:3000`)
3. Both devices must be on the same WiFi.

## Deploy to Vercel

The schema is already PostgreSQL — no code changes needed. Just:

**Step 1 — free Postgres:** https://neon.tech → create project → copy the
`postgresql://...?sslmode=require` connection string.

**Step 2 — Vercel env vars:** Project → Settings → Environment Variables, add:
- `DATABASE_URL` = your Neon connection string
- `AUTH_SECRET` = any long random string
  (`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`)
- `ID_HASH_SALT` = another long random string
- `APP_URL` = your live URL (optional, used in email links)

**Step 3 — Redeploy** (Deployments → latest → ⋯ → Redeploy). The build
automatically generates the Prisma client, creates all tables
(`prisma db push`), and seeds demo data on the first empty run.

## If you see an error message

- **"Database is not ready…"** → `DATABASE_URL` is missing or wrong. Add it in
  Vercel env vars (or your local `.env`) and redeploy. Make sure the Neon URL
  ends with `?sslmode=require`.
- **"Server is not configured: set the AUTH_SECRET…"** → add the `AUTH_SECRET`
  env var and redeploy.
- **"Invalid email or password"** → the account doesn't exist on THIS database
  (a fresh database starts empty — sign up first, or the seed will have created
  the demo accounts on first deploy).

## Switching Postgres providers later

Just change `DATABASE_URL` and redeploy — the build re-creates the tables in
the new database. To copy data across, use `pg_dump` / `pg_restore`.
