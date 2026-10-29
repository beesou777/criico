# Criico — Grassroots Cricket Manager

> **Position:** Full Stack Developer (Next.js)  
> **Company:** Criico Sports Technologies Pvt. Ltd.  
> **Focus:** Next.js (App Router), React 19, TypeScript, PostgreSQL, Custom Business Logic, JWT Authentication, and Unit Testing.

---

## 🏏 Overview

Criico "Grassroots Cricket Manager" is a full-stack web application designed for local cricket organizers to manage player rosters, record match performances, and rank players using an explainable **Custom Impact Score**.

### Core Highlights:
- **Full-Stack Next.js 15 (App Router)**: API Route Handlers (`/api/*`), React Server Components (RSC), and Server Actions in a unified application.
- **PostgreSQL Database**: Direct database connectivity with Supabase, atomic multi-table transactions (`BEGIN ... COMMIT`), and deterministic row locking (`FOR UPDATE ORDER BY id ASC`).
- **JWT in HTTP-Only Cookies**: Secure session management immune to XSS token theft.
- **Next.js Middleware**: Route protection (`middleware.ts`) redirecting unauthenticated traffic from `/dashboard/:path*` to `/login`.
- **Custom Impact Score Formula**: Pure TypeScript implementation using hundredth-point integer arithmetic to avoid floating-point inaccuracies.
- **UI Edge-Case Handling**: Strict client-side and server-side validation; negative "Total Runs" immediately triggers a Sonner UI toast notification.
- **100% Test Coverage**: 27 unit and end-to-end integration tests in Vitest covering formula edge cases, boundaries, validation rules, and live API endpoints.

---

## 🛠️ Tech Stack & Justifications

| Layer | Technology | Justification |
|---|---|---|
| **Framework** | Next.js 15 (App Router) & React 19 | Combines server rendering (RSC) for fast data access with Server Actions for mutations and API routes on a single runtime. |
| **Language** | TypeScript (Strict) | Enforces role safety (e.g., Wicketkeeper cannot have Bowler multiplier) and compile-time contract safety. |
| **Database** | PostgreSQL (Supabase) | Relational integrity (Foreign Keys, Cascades), ACID transactions for match recordings, row locking against deadlocks. |
| **Authentication** | JWT (`jose`) in HTTP-only cookies | Stored in `criico_session` cookie; inaccessible to client-side scripts, protecting against XSS. |
| **Styling** | Tailwind CSS v4 & Plus Jakarta Sans | Cricket pavilion theme (cream, forest green, Criico crimson `#DC143C`), accessible contrast, and smooth micro-animations. |
| **Testing** | Vitest & React Testing Library | Fast, native ESM unit and integration testing. |

---

## 📊 Database Schema

```mermaid
erDiagram
    USERS ||--o{ PLAYERS : owns
    USERS ||--o{ MATCHES : records
    MATCHES ||--o{ PERFORMANCES : contains
    PLAYERS ||--o{ PERFORMANCES : contributes

    USERS {
        uuid id PK
        varchar email UK
        varchar passwordHash
        timestamptz createdAt
    }

    PLAYERS {
        uuid id PK
        uuid ownerId FK
        varchar name
        varchar role
        numeric basePrice
        integer matchesPlayed
        integer totalRuns
        integer totalWickets
        timestamptz createdAt
        timestamptz updatedAt
    }

    MATCHES {
        uuid id PK
        uuid ownerId FK
        varchar teamA
        varchar teamB
        varchar result
        date playedAt
        uuid submissionKey UK
        varchar payloadHash
        timestamptz createdAt
    }

    PERFORMANCES {
        uuid id PK
        uuid matchId FK
        uuid playerId FK
        varchar teamSide
        integer runs
        integer wickets
    }
```

### Why PostgreSQL over MongoDB?
1. **Relational Model**: Organizers own Players and Matches, which consist of individual Player Performances. Foreign keys ensure referential integrity.
2. **ACID Transaction Atomicity**: Recording a match must insert the match, record all player performances, and increment each player's career totals (`matchesPlayed`, `totalRuns`, `totalWickets`) atomically. If any part fails, the entire transaction rolls back.
3. **Deadlock Prevention**: Players are locked in primary key order (`ORDER BY id ASC FOR UPDATE`) during match transactions, guaranteeing concurrent match submissions cannot deadlock.
4. **Optimistic Concurrency**: Player edits send `expectedUpdatedAt` to detect conflicting concurrent updates.

---

## 🧮 The Custom Cricket Impact Score Formula

Located in `src/lib/score.ts`:

### Formula Rules:
1. **Base Score**: `(Total Runs * 1.2) + (Total Wickets * 20)`
2. **Role Multipliers**:
   - **Bowler**: Wickets multiplied by `1.5` before adding to base (`Total Wickets * 30`).
   - **Batsman**: Runs multiplied by `1.3` before adding to base (`Total Runs * 1.56`).
   - **All-rounder**: Base formula (`Total Runs * 1.2 + Total Wickets * 20`).
   - **Wicketkeeper**: Flat `+30` points; **no role multiplier** allowed.
3. **Experience Penalty / Bonus**:
   - `< 5` matches: `-50` points (Rookie penalty)
   - `> 20` matches: `+100` points (Veteran bonus)
   - `5` to `20` matches: `0` points (Neutral)
4. **Edge Case Safety**:
   - Wicketkeeper role cannot have the Bowler multiplier (enforced via TypeScript single-role enum and Zod validation).
   - Negative scores are preserved (never clamped to zero).
   - All calculations use **hundredth-point integer arithmetic** internally to avoid IEEE 754 floating-point rounding quirks (`0.1 + 0.2 = 0.30000000000000004`).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v22+
- **pnpm**: v9+ (or `npm`)
- **PostgreSQL**: Supabase, Neon, or local PostgreSQL instance.

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `JWT_SECRET` (at least 32 characters) are set:
```env
DATABASE_URL=postgresql://postgres.dosqrwnowlprrwptqynp:ozR5Xbq8pqKJtaUy@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
JWT_SECRET=criico_grassroots_cricket_secure_jwt_token_secret_key_32_chars
PORT=3100
HOST=127.0.0.1
```

### 3. Database Migration & Seed
Run the database migration to create the tables and indexes:
```bash
pnpm db:migrate
```

(Optional) Populate realistic Nepal Premier League (NPL) showcase data (15 players across all 8 franchises, 4 matches, and full leaderboard rankings):
```bash
pnpm db:seed
```

**Showcase Demo Account:**
- **Email:** `bishwa@yopmail.com`
- **Password:** `Test@123`

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://127.0.0.1:3100](http://127.0.0.1:3100) in your browser.

---

## 🧪 Running Tests

The test suite runs with **Vitest**:
```bash
pnpm test
```

### Included Test Suites:
- `tests/score.test.ts`: 8 unit tests covering Bowler rookie penalty, Wicketkeeper bonus without multiplier, experience boundaries (4, 5, 20, 21 matches), veteran bonus, and negative score preservation.
- `tests/validation.test.ts`: 6 unit tests covering Nepal match date boundary, deduplication, team name validation, and price decimal precision.
- `tests/player-form.test.tsx`: Component test confirming negative "Total Runs" displays a UI toast error notification and aborts submission.
- `tests/auth-form.test.tsx`: Client-side login and registration form tests.
- `tests/session.test.ts`: JWT session signing and verification edge cases.
- `tests/api.test.ts`: 10 end-to-end integration tests verifying every API endpoint against live PostgreSQL.

Run type checking and linting:
```bash
pnpm typecheck
pnpm lint
```

---

## 📡 API Endpoints

All endpoints use JSON payloads and return structured errors `{ error: { message: string } }`:

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an organizer account and issue session cookie |
| `POST` | `/api/auth/login` | Authenticate organizer and set HTTP-only cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/players` | Fetch all players owned by authenticated organizer |
| `POST` | `/api/players` | Create a new player with initial career stats |
| `GET` | `/api/players/[id]` | Get single player details |
| `PUT` | `/api/players/[id]` | Update player stats with pessimistic concurrency check |
| `DELETE` | `/api/players/[id]` | Delete a player from the roster |
| `GET` | `/api/matches` | Fetch all recorded matches for organizer |
| `POST` | `/api/matches` | Atomically record a match and increment career stats |
| `GET` | `/api/leaderboard` | Return players ranked by Custom Impact Score |

---

## 🎥 Video Walkthrough Guide

Outline for technical project presentation:

1. **Introduction & Architecture (0:00 – 1:00)**:
   - Walk through the full-stack Next.js App Router structure: Server Actions for registration, React Server Components for the leaderboard, and Route Handlers for the REST endpoints.
   - Explain why PostgreSQL was chosen over MongoDB (relational cricket model, ACID transactions for career stats, row locking against deadlocks).
2. **Authentication Choice (1:00 – 1:45)**:
   - Explain why JWT stored in HTTP-only cookies was used (immune to XSS attacks, verified server-side in `middleware.ts` to protect `/dashboard`).
3. **Custom Impact Score Code Walkthrough (1:45 – 3:00)**:
   - Open `src/lib/score.ts`.
   - Explain the scoring logic: Batsman runs * 1.56, Bowler wickets * 30, rookie penalty (-50 for < 5 matches), veteran bonus (+100 for > 20 matches), and flat +30 for Wicketkeeper.
   - Highlight the **hundredth-point integer arithmetic** preventing JavaScript float rounding bugs.
   - Run `pnpm test` and show the 8 tests in `tests/score.test.ts` passing.
4. **Bug Fixed During Development (3:00 – 4:00)**:
   - Explain how jsdom in Vitest loaded the browser build of `jose` which failed cross-realm `instanceof Uint8Array` checks during API integration testing.
   - Show how adding `// @vitest-environment node` to the server integration tests and configuring pure Node.js runtime encoding solved the issue.
   - Show `tests/player-form.test.tsx` verifying the UI toast notification on negative runs input.
5. **Live App Demonstration (4:00 – 5:00)**:
   - Showcase the public landing page with cricket delivery animation.
   - Log in using the seeded showcase account (`bishwa@yopmail.com`), review squad rosters, view recorded matches, and inspect the real-time leaderboard with expandable score breakdown.
