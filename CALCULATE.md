# Criico Calculation Guide

This document describes the calculations used by the application for player scores, leaderboard ranking, match recording, and pagination.

## Cricket Impact Score

The Impact Score is calculated from a player's career statistics:

```text
Base runs contribution = Total Runs × 1.2
Base wickets contribution = Total Wickets × 20
```

The final score is:

```text
Impact Score =
  Runs contribution
  + Wickets contribution
  + Role bonus
  + Experience adjustment
  + Wicketkeeper bonus
```

### Role calculations

| Role | Calculation |
| --- | --- |
| Batsman | Adds `Total Runs × 0.36` as a role bonus. A run is therefore worth `1.2 + 0.36 = 1.56` points. |
| Bowler | Adds `Total Wickets × 10` as a role bonus. A wicket is therefore worth `20 + 10 = 30` points. |
| All-rounder | No additional role bonus. |
| Wicketkeeper | Adds a flat `+30` points. A wicketkeeper does not receive the Bowler bonus. |

### Experience calculations

| Matches played | Status | Adjustment |
| --- | --- | ---: |
| `0–4` | Rookie | `-50` |
| `5–20` | Regular | `0` |
| `21+` | Veteran | `+100` |

The boundaries are strict: exactly 5 matches is Regular, and exactly 20 matches is also Regular.

### Worked examples

#### Bowler example

```text
Total Runs = 180
Total Wickets = 74
Matches Played = 25
Role = Bowler
```

```text
Runs contribution    = 180 × 1.2  = 216
Wickets contribution = 74 × 20    = 1,480
Bowler role bonus    = 74 × 10    = 740
Veteran adjustment                = 100
Wicketkeeper bonus               = 0
                                      -----
Final Impact Score               = 2,536
```

#### Batsman example

```text
Total Runs = 500
Total Wickets = 2
Matches Played = 10
Role = Batsman
```

```text
Runs contribution    = 500 × 1.2  = 600
Wickets contribution = 2 × 20     = 40
Batsman role bonus   = 500 × 0.36 = 180
Regular adjustment                 = 0
                                      ---
Final Impact Score                = 820
```

#### Wicketkeeper example

```text
Total Runs = 1,000
Total Wickets = 10
Matches Played = 3
Role = Wicketkeeper
```

```text
Runs contribution     = 1,000 × 1.2 = 1,200
Wickets contribution  = 10 × 20     = 200
Wicketkeeper bonus                  = 30
Rookie adjustment                  = -50
                                       -----
Final Impact Score                 = 1,380
```

## Decimal precision

The implementation uses hundredths internally instead of floating-point arithmetic:

```text
1.2 points  → 120 hundredths
20 points   → 2,000 hundredths
0.36 points → 36 hundredths
30 points   → 3,000 hundredths
```

The integer contributions are added first and divided by `100` only when the final breakdown is returned. This avoids errors such as `1.2 + 1.2` becoming an imprecise binary floating-point value.

## Leaderboard ranking

The leaderboard calculates the score for the complete filtered roster before pagination.

Default ordering:

```text
1. Highest Impact Score first
2. Player name ascending when scores are tied
3. Player ID ascending when both score and name are tied
```

When a user selects another sort field, the selected field is ordered ascending or descending according to the selected direction. The same player-name and player-ID tie breakers are then applied.

## Pagination

For a page size of `limit` and page number `page`:

```text
Offset = (page - 1) × limit
Page rows = allRows.slice(Offset, Offset + limit)
Total pages = ceiling(totalItems ÷ limit)
```

For example, with 149 players and a limit of 20:

```text
Total pages = ceiling(149 ÷ 20) = 8
Page 1 offset = (1 - 1) × 20 = 0
Page 2 offset = (2 - 1) × 20 = 20
Page 8 offset = (8 - 1) × 20 = 140
```

## Match statistics

When a match is recorded, every selected player's career totals are updated atomically:

```text
Matches Played = Matches Played + 1
Total Runs     = Total Runs + Match Runs
Total Wickets  = Total Wickets + Match Wickets
```

These updates are applied only after the match input passes validation and the player belongs to the selected team side.

### Match limits

The application validates the following cricket constraints:

```text
Player wickets in one match       ≤ 10
Team players in one match         ≤ 11
Team wickets in one innings       ≤ 10
Runs and wickets                  ≥ 0
Runs and wickets                  must be whole numbers
```

The 11-player limit represents a playing XI. The career `Total Wickets` value can continue increasing across multiple matches; the 10-wicket limit applies to one match or innings only.

## Source of truth

The main scoring implementation is in `src/lib/score.ts`. Match input validation is in `src/lib/validation.ts`, leaderboard ranking is in `src/lib/services/players.ts`, and pagination calculations are in `src/lib/pagination.ts`.
