# Criico ? Grassroots Cricket Manager

A full-stack Next.js App Router application for local cricket organizers: manage players, record completed matches, and compare explainable player Impact Scores.

## Stack and database choice

Next.js 15, React, strict TypeScript, Tailwind CSS, Plus Jakarta Sans, PostgreSQL through pg, jose JWTs, bcrypt, Zod, and Vitest. PostgreSQL fits the relational User ? Player / Match ? Performance model, foreign keys, atomic match updates, uniqueness constraints, and row locking. Backend logic lives in Next.js; there is no separate Express deployment or TypeORM dependency.

## Local setup

1. Install Node.js 22+ and pnpm (packageManager records pnpm 11.17.0).
2. Run pnpm install.
3. Copy .env.example to .env. Set DATABASE_URL, a cryptographically random JWT_SECRET of at least 32 characters, and APP_ORIGIN.
4. Run pnpm db:migrate against the intended database.
5. Run pnpm dev and open http://127.0.0.1:3100.
6. Register an organizer account; each organizer manages their own data.

Never put real passwords, JWT signing secrets, or database connection strings in tracked files. Database connections use encrypted transport, but certificate verification is disabled for this assignment's hosted database compatibility.

Optional pnpm db:seed resets the configured showcase account's roster and match data. Set SEED_EMAIL and SEED_PASSWORD locally; no default login credential is published. Do not run seeding against an account whose records should be preserved.
Set SEED_ORGANIZATION_NAME to customize the organization name shown in the seeded dashboard; it defaults to Grassroots Cricket Manager.

## Assessment features

- Login/register with HTTP-only JWT cookies, Secure in production.
- middleware.ts redirects anonymous dashboard requests to login.
- API routes and server helpers independently verify authentication and scope records by owner.
- Registration form submits through a Next.js Server Action.
- Leaderboard fetching happens in a React Server Component.
- Player add/view/edit and deletion of players without historical performances.
- Organizer-owned teams with required player assignment and team-aware match entry.
- Atomic match recording, duplicate-submission protection, and career increments.
- Pure TypeScript scoring function with unit tests and expandable breakdowns.
- Negative Total Runs trigger an explicit UI toast.
- Server-side pagination, role/search filtering, stable ordering, and accurate total counts.

## API and pagination

| Method             | Route              | Purpose                                              |
| ------------------ | ------------------ | ---------------------------------------------------- |
| POST               | /api/auth/register | Create an account and set session cookie             |
| POST               | /api/auth/login    | Authenticate and set session cookie                  |
| POST               | /api/auth/logout   | Clear cookie                                         |
| GET / POST         | /api/players       | Paginated list / create                              |
| GET / PUT / DELETE | /api/players/[id]  | View / version-checked edit / delete if unreferenced |
| GET / POST         | /api/matches       | Paginated history / atomic match recording           |
| GET                | /api/leaderboard   | Paginated ranked players and breakdowns              |
| GET / POST         | /api/teams         | List / create organizer-owned teams                  |

JWTs are never returned in response JSON. Browser mutations require a matching Origin and JSON body where applicable. Errors use { error: { message } } with appropriate 400/401/403/404/409/413/415/429/500 statuses.

List endpoints accept page=1&limit=20 (limit 1?100). Players and leaderboard additionally accept search and role. Responses:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

The data above is abbreviated to illustrate the metadata contract. An empty dataset has totalItems/totalPages 0, page 1, and null next/previous pages. Out-of-range pages normalize to the final available page. Filters run before paging; leaderboard scores are sorted globally before LIMIT/OFFSET. The dashboard uses aggregate totals, independently of pagination.

## Scoring

Runs ? 1.2 (? 1.3 for Batsmen) plus wickets ? 20 (? 1.5 for Bowlers). Fewer than 5 matches subtracts 50; more than 20 adds 100. Wicketkeepers add 30 with no role multiplier. Exactly 5 and 20 have no adjustment. Negative scores are valid. Integer hundredths preserve precision.

See ARCHITECTURE.md and BUG_LOG.md for design decisions and real bug explanations.

See VERIFICATION.md for the exact executed checks, browser results, and remaining limits.

## Verification

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

Tests are not a claim of 100% code coverage. By default, live database-writing tests are skipped. For integration verification, configure a dedicated disposable TEST_DATABASE_URL; the suite refuses the application's configured database. It needs an existing migrated schema. These tests call route handlers, not a real browser/server.

No production build is run without the user's explicit instruction. Build, deployment, and the mandatory 3?5 minute Loom remain separate submission checks. Use pnpm build only when authorized, then deploy on a Next.js-compatible Node platform with PostgreSQL. Set HTTPS APP_ORIGIN and server-only secrets.

## Known operational boundaries

Authentication throttling is per Node process and normalized email; distributed production needs a shared rate-limit store and deployment-level controls. JWT logout clears the cookie; immediate stolen-token revocation is not implemented. The optional player selector loads lightweight roster options for match recording. Existing performance records are protected from player deletion.

The previously committed database credential must be rotated at the provider and removed from exposed Git history before public submission. Editing this README cannot revoke it.
