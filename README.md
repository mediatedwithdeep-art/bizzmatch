# BizMatch — Verified B2B Networking

A mobile-first B2B networking app with Tinder-style discovery: business owners verify their
company (GSTIN / PAN / Aadhaar), get admin-approved, then swipe through other verified
businesses. A mutual "Interested" unlocks chat.

## Stack

| Layer      | Choice                                  | Why                                                    |
| ---------- | --------------------------------------- | ------------------------------------------------------ |
| Framework  | Next.js 15 (App Router, TypeScript)     | One deployable unit: API routes + SSR + mobile-first UI |
| Database   | Prisma ORM + SQLite (dev) / Postgres (prod) | Zero-config locally; one-line swap for production   |
| Auth       | JWT (jose, HS256) in httpOnly cookie    | Stateless, edge-verifiable in middleware               |
| Passwords  | bcryptjs (cost 12)                      | Battle-tested hashing                                  |
| Validation | zod on every API input                  | Single source of truth for input rules                 |
| Styling    | Tailwind CSS v4                         | Fast iteration, consistent design tokens               |

## Quick start

```bash
npm install
cp .env.example .env        # then set real secrets (see below)
npm run db:push             # create the SQLite schema
npm run db:seed             # demo data (optional)
npm run dev                 # http://localhost:3000
```

### Demo accounts (after `npm run db:seed`, password `demo1234`)

- **Admin:** `admin@bizmatch.demo` — verification queue at `/admin`
- **Verified member:** `priya@textilehub.demo` (plus 7 more verified businesses)
- **Pending member:** `amit@greenbuild.demo` — stuck at the review screen

## Product flow

1. **Signup** (`/signup`) → email + password, rate-limited, bcrypt-hashed.
2. **Onboarding** (`/onboarding`) → 3-step form: company details, profile
   (about / products / goals), then GSTIN + PAN + Aadhaar. Formats are validated
   server-side; the same GSTIN/Aadhaar cannot be registered by two accounts.
3. **Admin review** (`/admin`) → approve or reject (with a reason). The applicant is
   notified; rejected users can fix and resubmit.
4. **Discover** (`/discover`) → swipe deck of verified businesses. Drag or tap
   ✕ / 🤝. **Search** (`/search`) is the same deck scoped by industry, city, keywords.
5. **Match** → mutual "Interested" creates a Connection, notifies both sides, and
   unlocks **chat** (`/chat/[id]`, 3s polling for the MVP).
6. **Network** (`/connections`), **Alerts** (`/notifications`), **Profile** (`/profile`,
   editable except locked verification documents).

## Security notes

- **Aadhaar is never stored in plaintext** — only a salted SHA-256 digest (for
  cross-account dedupe) and the last 4 digits (for display).
- Session JWTs live in an `httpOnly`, `SameSite=Lax`, `Secure` (in prod) cookie.
- Middleware verifies the JWT at the edge for every non-public route; admin routes
  additionally require the `ADMIN` role; discovery/swipes/chat require a `VERIFIED` profile.
- Chat messages are only readable/writable by the two connection participants.
- Login/signup and message-send are rate-limited (in-memory; swap for Redis when
  scaling past one instance).
- Uniform error for wrong email vs wrong password; `AUTH_SECRET` placeholder is
  rejected at boot in production.

## Environment

| Variable       | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `DATABASE_URL` | `file:./dev.db` locally; a `postgresql://…` URL in prod    |
| `AUTH_SECRET`  | JWT signing key — `openssl rand -base64 48`                |
| `ID_HASH_SALT` | Salt for hashing government IDs — set once, never rotate   |

## Going to production

1. Change `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`, point
   `DATABASE_URL` at Postgres, run `prisma migrate deploy`.
2. Set strong `AUTH_SECRET` / `ID_HASH_SALT`.
3. `npm run build && npm start` (the build runs `prisma generate` + `db push`), or deploy
   to Vercel/Fly/Render as a standard Next.js app.
4. When scaling horizontally: move rate limiting to Redis and chat polling to
   Pusher/Ably/WebSockets — both are isolated behind small modules.

## Deliberately out of scope for v1

Real GSTIN/PAN API verification (admin reviews manually), file uploads, email
delivery, push notifications, payments, block/report, unmatch. Each has a clear
seam in the code to add later.

## Structure

```
prisma/schema.prisma        # data model (User, BusinessProfile, Swipe, Connection, Message, Notification)
prisma/seed.ts              # demo data
src/middleware.ts           # edge JWT gate + admin role check
src/lib/                    # auth, db, validators, crypto, rate-limit, api helpers
src/app/api/                # REST endpoints (auth, verification, discover, swipes, connections, messages, notifications, admin)
src/app/                    # pages: landing, login/signup, onboarding, pending, admin
src/app/(app)/              # verified-member shell: discover, search, connections, chat, notifications, profile
src/components/             # SwipeDeck, BusinessCard, BottomNav, forms
```
