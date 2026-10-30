# Development Bug Log

## Review fixes: timestamp precision and date-only values

The pg driver returns timestamps as JavaScript Date objects. The previous formatter converted them through String(date), which dropped milliseconds; an unchanged player could then fail the stale-edit comparison. All player queries now return UTC timestamps with six fractional digits, and updates require that exact version under a row lock. Regression tests cover both timestamp preservation and a one-microsecond conflict.

PostgreSQL DATE values were parsed as local midnight and then converted to UTC, which shifted Nepal dates to the previous day. Match list SQL now returns date-only text, and the Date fallback uses local calendar components. Impossible calendar dates are rejected before querying.

## 1. UTC Date Rejected a Valid Nepal Match Date

**Issue:** Initial date validation compared `playedAt` against `new Date().toISOString().slice(0, 10)`. Because the server runs in UTC while grassroots matches in Nepal operate in `Asia/Kathmandu` (UTC+5:45), an organizer recording an evening match at 20:00 UTC (01:45 AM local time in Nepal) had their valid current-day match rejected with `"A completed match cannot be in the future."`

**Fix:** Created `cricketToday()` in `src/lib/validation.ts` utilizing `Intl.DateTimeFormat` with `timeZone: 'Asia/Kathmandu'`. Verified with a boundary regression test in `tests/validation.test.ts` confirming that `2026-10-28T20:00:00Z` resolves accurately to `2026-10-29`.
