import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { query, getDb } from './db';
import { calculateImpactScore, type ScoreBreakdown } from './score';
import {
  canonicalMatch,
  type PlayerInput,
  type PlayerUpdateInput,
  type MatchInput,
} from './validation';

export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface UserRecord {
  id: string;
  email: string;
  createdAt: string;
}

export interface PlayerRecord {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
  basePrice: number;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  updatedAt: string;
}

export interface RankedPlayerRecord extends PlayerRecord {
  score: ScoreBreakdown;
}

export interface MatchRecord {
  id: string;
  teamA: string;
  teamB: string;
  result: 'A' | 'B' | 'TIE' | 'NO_RESULT';
  playedAt: string;
  submissionKey?: string;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

// ----------------- Auth Services -----------------

export async function createUser(email: string, password: string): Promise<UserRecord> {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const res = await query<UserRecord>(
      `INSERT INTO users (email, "passwordHash")
       VALUES ($1, $2)
       RETURNING id, email, "createdAt"`,
      [email.toLowerCase().trim(), passwordHash],
    );
    const user = res.rows[0];
    if (!user) {
      throw new ServiceError(500, 'User creation failed.');
    }
    return user;
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw new ServiceError(409, 'An account with this email already exists. Sign in instead.');
    }
    throw err;
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserRecord> {
  const normalizedEmail = email.toLowerCase().trim();
  const res = await query<{ id: string; email: string; passwordHash: string; createdAt: Date }>(
    `SELECT id, email, "passwordHash", "createdAt" FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  const user = res.rows[0];
  // Fallback hash to mitigate timing attacks against non-existent accounts
  const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxD/6K0aIKM.IQOqFQKsL0Svba.';
  const valid = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

  if (!user || !valid) {
    throw new ServiceError(401, 'Email or password is incorrect.');
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

// ----------------- Player Services -----------------

function formatPlayerRow(row: Record<string, unknown>): PlayerRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    role: row.role as PlayerRecord['role'],
    basePrice: Number(row.basePrice),
    matchesPlayed: Number(row.matchesPlayed),
    totalRuns: Number(row.totalRuns),
    totalWickets: Number(row.totalWickets),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  };
}

export async function getPlayers(ownerId: string): Promise<PlayerRecord[]> {
  const res = await query(
    `SELECT id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets", "updatedAt"
     FROM players
     WHERE "ownerId" = $1
     ORDER BY name ASC`,
    [ownerId],
  );
  return res.rows.map(formatPlayerRow);
}

export async function getPlayerById(ownerId: string, id: string): Promise<PlayerRecord | null> {
  const res = await query(
    `SELECT id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets", "updatedAt"
     FROM players
     WHERE "ownerId" = $1 AND id = $2`,
    [ownerId, id],
  );
  const player = res.rows[0];
  if (!player) return null;
  return formatPlayerRow(player);
}

export async function createPlayer(ownerId: string, input: PlayerInput): Promise<PlayerRecord> {
  const res = await query(
    `INSERT INTO players ("ownerId", name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets", "updatedAt"`,
    [
      ownerId,
      input.name,
      input.role,
      input.basePrice,
      input.matchesPlayed,
      input.totalRuns,
      input.totalWickets,
    ],
  );
  const created = res.rows[0];
  if (!created) {
    throw new ServiceError(500, 'Could not create player.');
  }
  return formatPlayerRow(created);
}

export async function updatePlayer(
  ownerId: string,
  id: string,
  input: PlayerUpdateInput,
): Promise<PlayerRecord> {
  const pool = getDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const selectRes = await client.query(
      `SELECT id, "updatedAt" FROM players WHERE id = $1 AND "ownerId" = $2 FOR UPDATE`,
      [id, ownerId],
    );

    if (!selectRes.rows.length) {
      throw new ServiceError(404, 'Player not found.');
    }

    const current = selectRes.rows[0];
    if (
      input.expectedUpdatedAt &&
      new Date(current.updatedAt).toISOString() !== new Date(input.expectedUpdatedAt).toISOString()
    ) {
      throw new ServiceError(
        409,
        'This player was updated in another session. Please reload the page before saving.',
      );
    }

    const updateRes = await client.query(
      `UPDATE players
       SET name = $1, role = $2, "basePrice" = $3, "matchesPlayed" = $4,
           "totalRuns" = $5, "totalWickets" = $6, "updatedAt" = now()
       WHERE id = $7 AND "ownerId" = $8
       RETURNING id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets", "updatedAt"`,
      [
        input.name,
        input.role,
        input.basePrice,
        input.matchesPlayed,
        input.totalRuns,
        input.totalWickets,
        id,
        ownerId,
      ],
    );

    await client.query('COMMIT');
    return formatPlayerRow(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deletePlayer(ownerId: string, id: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM players WHERE id = $1 AND "ownerId" = $2 RETURNING id`,
    [id, ownerId],
  );
  if (!res.rows.length) {
    throw new ServiceError(404, 'Player not found.');
  }
  return true;
}

// ----------------- Leaderboard Service -----------------

export async function getLeaderboard(ownerId: string): Promise<RankedPlayerRecord[]> {
  const players = await getPlayers(ownerId);
  const ranked: RankedPlayerRecord[] = players.map((player) => ({
    ...player,
    score: calculateImpactScore(player),
  }));

  // Sort descending by Impact Score, then by name ASC, then by id ASC
  return ranked.sort((a, b) => {
    if (b.score.total !== a.score.total) {
      return b.score.total - a.score.total;
    }
    const nameDiff = a.name.localeCompare(b.name, 'en');
    if (nameDiff !== 0) return nameDiff;
    return a.id.localeCompare(b.id);
  });
}

// ----------------- Match Services -----------------

function formatMatchRow(row: Record<string, unknown>): MatchRecord {
  const dateVal = row.playedAt;
  const dateStr =
    dateVal instanceof Date
      ? dateVal.toISOString().slice(0, 10)
      : String(dateVal).slice(0, 10);
  return {
    id: String(row.id),
    teamA: String(row.teamA),
    teamB: String(row.teamB),
    result: row.result as MatchRecord['result'],
    playedAt: dateStr,
    submissionKey: row.submissionKey ? String(row.submissionKey) : undefined,
  };
}

export async function getMatches(ownerId: string): Promise<MatchRecord[]> {
  const res = await query(
    `SELECT id, "teamA", "teamB", result, "playedAt", "submissionKey"
     FROM matches
     WHERE "ownerId" = $1
     ORDER BY "playedAt" DESC, "createdAt" DESC`,
    [ownerId],
  );
  return res.rows.map(formatMatchRow);
}

export async function recordMatch(
  ownerId: string,
  input: MatchInput,
): Promise<{ match: MatchRecord; replayed: boolean }> {
  const payloadHash = createHash('sha256')
    .update(canonicalMatch(input))
    .digest('hex');

  // Check idempotency first
  const existingRes = await query(
    `SELECT id, "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash"
     FROM matches
     WHERE "ownerId" = $1 AND "submissionKey" = $2`,
    [ownerId, input.submissionKey],
  );

  const existing = existingRes.rows[0];
  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      throw new ServiceError(
        409,
        'This submission key was already used for a different match.',
      );
    }
    return { match: formatMatchRow(existing), replayed: true };
  }

  const pool = getDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert match record
    const matchInsert = await client.query(
      `INSERT INTO matches ("ownerId", "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, "teamA", "teamB", result, "playedAt", "submissionKey"`,
      [
        ownerId,
        input.teamA,
        input.teamB,
        input.result,
        input.playedAt,
        input.submissionKey,
        payloadHash,
      ],
    );
    const createdMatch = matchInsert.rows[0];

    // Lock players in stable order (ID ASC) to prevent deadlocks
    const playerIds = input.performances.map((p) => p.playerId);
    const playersLockRes = await client.query(
      `SELECT id, "matchesPlayed", "totalRuns", "totalWickets"
       FROM players
       WHERE "ownerId" = $1 AND id = ANY($2::uuid[])
       ORDER BY id ASC
       FOR UPDATE`,
      [ownerId, playerIds],
    );

    if (playersLockRes.rows.length !== playerIds.length) {
      throw new ServiceError(
        404,
        'One or more selected players are unavailable or belonged to another organizer.',
      );
    }

    const lockedPlayersMap = new Map(playersLockRes.rows.map((p) => [p.id, p]));

    // Record performances and update totals atomically
    for (const perf of input.performances) {
      const p = lockedPlayersMap.get(perf.playerId)!;
      if (
        p.matchesPlayed + 1 > 10_000_000 ||
        p.totalRuns + perf.runs > 10_000_000 ||
        p.totalWickets + perf.wickets > 10_000_000
      ) {
        throw new ServiceError(
          400,
          'This match would exceed the supported career statistics limit.',
        );
      }

      await client.query(
        `INSERT INTO performances ("matchId", "playerId", "teamSide", runs, wickets)
         VALUES ($1, $2, $3, $4, $5)`,
        [createdMatch.id, perf.playerId, perf.teamSide, perf.runs, perf.wickets],
      );

      await client.query(
        `UPDATE players
         SET "matchesPlayed" = "matchesPlayed" + 1,
             "totalRuns" = "totalRuns" + $1,
             "totalWickets" = "totalWickets" + $2,
             "updatedAt" = now()
         WHERE id = $3 AND "ownerId" = $4`,
        [perf.runs, perf.wickets, perf.playerId, ownerId],
      );
    }

    await client.query('COMMIT');
    return { match: formatMatchRow(createdMatch), replayed: false };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(err)) {
      // Unique violation on (ownerId, submissionKey) under race conditions
      const raceRes = await query(
        `SELECT id, "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash"
         FROM matches
         WHERE "ownerId" = $1 AND "submissionKey" = $2`,
        [ownerId, input.submissionKey],
      );
      const race = raceRes.rows[0];
      if (race && race.payloadHash === payloadHash) {
        return { match: formatMatchRow(race), replayed: true };
      }
      throw new ServiceError(409, 'This submission key was already used for another match.');
    }
    throw err;
  } finally {
    client.release();
  }
}
