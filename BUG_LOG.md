# Development Bug Log

## Review fixes: timestamp precision and date-only values

The pg driver returns timestamps as JavaScript Date objects. The previous formatter converted them through String(date), which dropped milliseconds; an unchanged player could then fail the stale-edit comparison. All player queries now return UTC timestamps with six fractional digits, and updates require that exact version under a row lock. Regression tests cover both timestamp preservation and a one-microsecond conflict.

PostgreSQL DATE values were parsed as local midnight and then converted to UTC, which shifted Nepal dates to the previous day. Match list SQL now returns date-only text, and the Date fallback uses local calendar components. Impossible calendar dates are rejected before querying.

## Pagination and security review

Player, match, and leaderboard lists previously fetched entire datasets. They now return data/meta envelopes with validated page/limit, accurate counts, normalized bounds, and deterministic sorting. Filtering and leaderboard scoring happen before LIMIT/OFFSET. A single SQL statement keeps counts and page rows in the same snapshot. Dashboard summaries use aggregate queries independently of list limits.

JWT fallback signing was removed; API auth responses no longer expose tokens in JSON. Registration paths share UTF-8-aware password validation, mutation origin checks and request-size limits are enforced, and per-process auth throttling was added. Current documentation no longer contains database credentials; provider rotation and historical Git cleanup remain external follow-up work. Local certificate-verification skipping is an explicit user-requested development-only setting.

## 1. UTC Date Rejected a Valid Nepal Match Date

**Issue:** Initial date validation compared `playedAt` against `new Date().toISOString().slice(0, 10)`. Because the server runs in UTC while grassroots matches in Nepal operate in `Asia/Kathmandu` (UTC+5:45), an organizer recording an evening match at 20:00 UTC (01:45 AM local time in Nepal) had their valid current-day match rejected with `"A completed match cannot be in the future."`

**Fix:** Created `cricketToday()` in `src/lib/validation.ts` utilizing `Intl.DateTimeFormat` with `timeZone: 'Asia/Kathmandu'`. Verified with a boundary regression test in `tests/validation.test.ts` confirming that `2026-10-28T20:00:00Z` resolves accurately to `2026-10-29`.

---

## 2. Stale Player Edit Could Overwrite Concurrent Match Statistics

**Issue:** If an organizer opened a player edit form, and a match involving that player was completed and committed before the edit form was saved, submitting the edit form would blindly overwrite the newly incremented match statistics with stale pre-match career totals.

**Fix:** The player update payload now requires `expectedUpdatedAt`. Inside an atomic transaction with a pessimistic row lock (`FOR UPDATE`), the database compares the record's current `updatedAt` timestamp against `expectedUpdatedAt`. If mismatched, it aborts with HTTP 409 Conflict: `"This player was updated in another session. Please reload the page before saving."`

---

## 3. Jose Web API Key Realm Mismatch in Vitest / jsdom

**Issue:** When executing API integration tests in Vitest with a `jsdom` test environment, `jose`'s Web API build threw `TypeError: Key for the HS256 algorithm must be one of type Uint8Array` because jsdom creates an isolated browser VM realm where `key instanceof Uint8Array` returns `false` across realm boundaries.

**Fix:** Added `// @vitest-environment node` to `tests/api.test.ts` and `tests/session.test.ts` to execute server route handlers within the native Node.js runtime environment.
