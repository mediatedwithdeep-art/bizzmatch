# BizMatch API

All endpoints are JSON over HTTPS. Authentication uses an `httpOnly` access-token
cookie (15 min) plus a rotating refresh-token cookie (30 days, single-use,
hashed at rest). Errors are always `{ "error": "message" }` with a proper HTTP
status; validation errors add `issues: [{ path, message }]`.

Pagination: list endpoints accept `?limit=` and `?cursor=` (the `nextCursor`
from the previous page; `null` means the end).

Rate limits (per IP/user): signup & login 10/min · forgot/reset 5/min ·
swipes 60/min · messages 30/min · reports 5/hour.

## Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | `{name,email,password,companyName,industry,country,city}` → 201, session cookies, `next:"/discover"` (auto-approved) |
| POST | `/api/auth/login` | `{email,password}` → session cookies, `next` route by role |
| POST | `/api/auth/refresh` | Rotates the refresh token; 401 if reused/expired |
| POST | `/api/auth/logout` | Revokes refresh tokens, clears cookies |
| GET | `/api/auth/verify-email?token=` | Email-link target; marks email verified |
| POST | `/api/auth/forgot-password` | `{email}` → always 200 (no account enumeration) |
| POST | `/api/auth/reset-password` | `{token,password}` → revokes all sessions |

## Profile & companies

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/profile` | Own account + profile + `completeness {score, missing[]}` |
| POST | `/api/profile` | Create profile (legacy accounts) `{companyName,industry,country,city,…}` |
| PUT | `/api/profile` | Partial update; all enrichment fields optional |
| GET | `/api/companies/:userId` | Public company page + `social {followers, savedByMe, followedByMe}` |

## Discovery & matching

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/discover` | Recommendation-ranked deck. Filters: `industry, city, country, q, limit` |
| POST | `/api/swipes` | `{targetUserId, direction: INTERESTED\|SKIP}` → `{match, connectionId?}` |
| GET | `/api/connections` | Paginated connections with last message |
| GET | `/api/connections/:id/messages` | History (+ `?after=` ISO timestamp for incremental polling) |
| POST | `/api/connections/:id/messages` | `{body}` → 201 |

## Social graph

| Method | Path | Description |
| --- | --- | --- |
| GET/POST/DELETE | `/api/saved` | Bookmarked profiles (`{targetUserId}` for write ops) |
| GET/POST/DELETE | `/api/follows` | Follow businesses; target gets a notification |
| GET/POST/DELETE | `/api/blocks` | Block hides both parties everywhere and severs follows/saves |
| POST | `/api/reports` | `{targetUserId, reason: SPAM\|FAKE_BUSINESS\|INAPPROPRIATE\|SCAM\|OTHER, detail?}` |

## Notifications

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications` | Paginated + `unread` count |
| PATCH | `/api/notifications` | Mark all read |

## Verification framework (disabled by default)

Set `VERIFICATION_ENABLED=true` to open document submission. Accounts are
fully functional without it; approval grants the **Verified Business** badge
and a ranking boost.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/verification` | `{gstin, pan, aadhaar}` → 503 while disabled |
| GET | `/api/admin/verifications` | Pending queue (admin) |
| POST | `/api/admin/verifications/:id` | `{action: APPROVE\|REJECT, reason?}` |

## Admin (ADMIN / SUPER_ADMIN)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/analytics` | Totals, 7-day activity, top industries (60s cache) |
| GET | `/api/admin/users?q=` | User directory search |
| PATCH | `/api/admin/users/:id` | `{suspended}` any admin · `{role}` super admin only |
| GET | `/api/admin/reports?status=` | Report queue |
| PATCH | `/api/admin/reports/:id` | `{status: RESOLVED\|DISMISSED}` |
| GET | `/api/admin/audit?action=` | Audit trail (prefix filter, e.g. `auth.`) |

## Extension points

- **Recommendations** — `src/lib/recommend.ts` is a pure ranking function;
  swap the heuristic for embedding similarity without touching call sites.
- **Email** — `src/lib/mailer.ts` logs in dev; plug an HTTP relay (Resend,
  SES) in one place.
- **Cache / rate limits** — in-memory with Redis-shaped interfaces
  (`src/lib/cache.ts`, `src/lib/rate-limit.ts`); swap for ioredis when
  scaling horizontally.
- **Database** — change the Prisma provider to `postgresql` and set
  `DATABASE_URL`; indexes are already declared in the schema.
