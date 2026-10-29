import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { query, getDb } from './db';
import { z } from 'zod';
import {
  paginationMeta,
  playerListQuerySchema,
  matchListQuerySchema,
  type PaginationInput,
  type PlayerListQuery,
  type Paginated,
} from './pagination';
import {
  calculateImpactScore,
  getExperienceStatus,
  type ExperienceStatus,
  type ScoreBreakdown,
} from './score';
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
  teamId: string;
  teamName: string;
  updatedAt: string;
}

export interface TeamRecord {
  id: string;
  name: string;
  playerCount: number;
}

export interface RankedPlayerRecord extends PlayerRecord {
  score: ScoreBreakdown;
  experienceStatus: ExperienceStatus;
}

export interface MatchRecord {
  id: string;
  teamA: string;
  teamB: string;
  result: 'A' | 'B' | 'TIE' | 'NO_RESULT';
  playedAt: string;
  submissionKey?: string;
}

export interface MatchPerformanceRecord {
  playerId: string;
  playerName: string;
  role: PlayerRecord['role'];
  runs: number;
  wickets: number;
}

export interface MatchDetailsRecord extends MatchRecord {
  teamAPerformances: MatchPerformanceRecord[];
  teamBPerformances: MatchPerformanceRecord[];
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

export async function createUser(
  email: string,
  password: string,
): Promise<UserRecord> {
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
      throw new ServiceError(
        409,
        'An account with this email already exists. Sign in instead.',
      );
    }
    throw err;
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<UserRecord> {
  const normalizedEmail = email.toLowerCase().trim();
  const res = await query<{
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }>(
    `SELECT id, email, "passwordHash", "createdAt" FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  const user = res.rows[0];
  // Fallback hash to mitigate timing attacks against non-existent accounts
  const dummyHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxD/6K0aIKM.IQOqFQKsL0Svba.';
  const valid = await bcrypt.compare(
    password,
    user ? user.passwordHash : dummyHash,
  );

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

export function formatPlayerRow(row: Record<string, unknown>): PlayerRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    role: row.role as PlayerRecord['role'],
    basePrice: Number(row.basePrice),
    matchesPlayed: Number(row.matchesPlayed),
    totalRuns: Number(row.totalRuns),
    totalWickets: Number(row.totalWickets),
    teamId: String(row.teamId),
    teamName: String(row.teamName),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : z.iso.datetime().parse(row.updatedAt),
  };
}

const playerColumns = `id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets",
  "teamId", (SELECT name FROM teams WHERE teams.id = "teamId") AS "teamName",
  to_char("updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"`;

function playerFilters(ownerId: string, input: PlayerListQuery) {
  const conditions = ['"ownerId" = $1'];
  const params: unknown[] = [ownerId];
  if (input.search) {
    params.push(input.search);
    conditions.push(`strpos(lower(name), lower($${params.length})) > 0`);
  }
  if (input.role) {
    params.push(input.role);
    conditions.push(`role = $${params.length}`);
  }
  if (input.teamId) {
    params.push(input.teamId);
    conditions.push(`"teamId" = $${params.length}`);
  }
  return { where: conditions.join(' AND '), params };
}

function playerOrder(input: PlayerListQuery, leaderboard = false) {
  const requestedKey = input.sort ?? (leaderboard ? 'impact' : 'name');
  const key = requestedKey === 'impact' && !leaderboard ? 'name' : requestedKey;
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const columns: Record<string, string> = {
    impact: '"scoreHundredths"',
    name: 'lower(name) COLLATE "C"',
    team: 'lower("teamName") COLLATE "C"',
    matches: '"matchesPlayed"',
    runs: '"totalRuns"',
    wickets: '"totalWickets"',
    basePrice: '"basePrice"',
  };
  const column = columns[key] ?? columns.name;
  return `${column} ${direction}, lower(name) COLLATE "C" ASC, id ASC`;
}

// Count, normalized page, and rows use one PostgreSQL statement/snapshot.
// SQL fragments are constants authored here; all external values are parameters.
async function paginatedRows(
  filteredSQL: string,
  orderSQL: string,
  params: unknown[],
  input: PaginationInput,
) {
  const limitIndex = params.length + 1;
  const pageIndex = params.length + 2;
  const result = await query<{
    data: Record<string, unknown>[];
    totalItems: string;
  }>(
    `WITH filtered AS (${filteredSQL}), counted AS (SELECT count(*) AS total FROM filtered)
     SELECT total::text AS "totalItems", COALESCE((SELECT json_agg(item) FROM (
       SELECT * FROM filtered ORDER BY ${orderSQL} LIMIT $${limitIndex}
       OFFSET ((LEAST($${pageIndex}::bigint, GREATEST(1, CEIL(total::numeric / $${limitIndex})))) - 1)::bigint * $${limitIndex}
     ) item), '[]'::json) AS data FROM counted`,
    [...params, input.limit, input.page],
  );
  const row = result.rows[0];
  if (!row) throw new ServiceError(500, 'Could not read list.');
  return {
    rows: row.data,
    meta: paginationMeta(Number(row.totalItems), input),
  };
}

export async function getPlayers(
  ownerId: string,
  options: PlayerListQuery = playerListQuerySchema.parse({}),
): Promise<Paginated<PlayerRecord>> {
  const input = playerListQuerySchema.parse(options);
  const filters = playerFilters(ownerId, input);
  const result = await paginatedRows(
    `SELECT ${playerColumns} FROM players WHERE ${filters.where}`,
    playerOrder(input),
    filters.params,
    input,
  );
  return { data: result.rows.map(formatPlayerRow), meta: result.meta };
}

export async function getPlayerOptions(ownerId: string) {
  const res = await query<{
    id: string;
    name: string;
    role: PlayerRecord['role'];
    teamId: string;
    teamName: string;
  }>(
    'SELECT players.id, players.name, players.role, players."teamId", teams.name AS "teamName" FROM players LEFT JOIN teams ON teams.id = players."teamId" WHERE players."ownerId" = $1 ORDER BY lower(players.name) COLLATE "C", players.id',
    [ownerId],
  );
  return res.rows;
}

export async function getTeams(ownerId: string): Promise<TeamRecord[]> {
  const res = await query<
    Omit<TeamRecord, 'playerCount'> & { playerCount: string }
  >(
    `SELECT teams.id, teams.name, count(players.id)::text AS "playerCount"
     FROM teams
     LEFT JOIN players ON players."teamId" = teams.id AND players."ownerId" = teams."ownerId"
     WHERE teams."ownerId" = $1
     GROUP BY teams.id, teams.name
     ORDER BY lower(teams.name) COLLATE "C", teams.id`,
    [ownerId],
  );
  return res.rows.map((team) => ({
    ...team,
    playerCount: Number(team.playerCount),
  }));
}

export async function createTeam(
  ownerId: string,
  name: string,
): Promise<Pick<TeamRecord, 'id' | 'name'>> {
  try {
    const res = await query<Pick<TeamRecord, 'id' | 'name'>>(
      'INSERT INTO teams ("ownerId", name) VALUES ($1, $2) RETURNING id, name',
      [ownerId, name.trim()],
    );
    return res.rows[0]!;
  } catch (error) {
    if (isUniqueViolation(error))
      throw new ServiceError(409, 'You already have a team with this name.');
    throw error;
  }
}

export async function getPlayerById(
  ownerId: string,
  id: string,
): Promise<PlayerRecord | null> {
  const res = await query(
    `SELECT ${playerColumns}
     FROM players
     WHERE "ownerId" = $1 AND id = $2`,
    [ownerId, id],
  );
  const player = res.rows[0];
  if (!player) return null;
  return formatPlayerRow(player);
}

export async function createPlayer(
  ownerId: string,
  input: PlayerInput,
): Promise<PlayerRecord> {
  if (input.teamId) {
    const team = await query(
      'SELECT 1 FROM teams WHERE id = $1 AND "ownerId" = $2',
      [input.teamId, ownerId],
    );
    if (!team.rowCount)
      throw new ServiceError(400, 'Choose one of your teams.');
  }
  const res = await query(
    `INSERT INTO players ("ownerId", name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets", "teamId")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      ownerId,
      input.name,
      input.role,
      input.basePrice,
      input.matchesPlayed,
      input.totalRuns,
      input.totalWickets,
      input.teamId ?? null,
    ],
  );
  const created = res.rows[0];
  if (!created) {
    throw new ServiceError(500, 'Could not create player.');
  }
  const createdPlayer = await query(
    `SELECT ${playerColumns} FROM players WHERE id = $1 AND "ownerId" = $2`,
    [created.id, ownerId],
  );
  if (!createdPlayer.rows[0]) {
    throw new ServiceError(500, 'Could not read the created player.');
  }
  return formatPlayerRow(createdPlayer.rows[0]);
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
      `SELECT id, to_char("updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt" FROM players WHERE id = $1 AND "ownerId" = $2 FOR UPDATE`,
      [id, ownerId],
    );

    if (!selectRes.rows.length) {
      throw new ServiceError(404, 'Player not found.');
    }

    const current = selectRes.rows[0];
    if (current.updatedAt !== input.expectedUpdatedAt) {
      throw new ServiceError(
        409,
        'This player was updated in another session. Please reload the page before saving.',
      );
    }
    if (input.teamId) {
      const team = await client.query(
        'SELECT 1 FROM teams WHERE id = $1 AND "ownerId" = $2',
        [input.teamId, ownerId],
      );
      if (!team.rowCount)
        throw new ServiceError(400, 'Choose one of your teams.');
    }

    const updateRes = await client.query(
      `UPDATE players
       SET name = $1, role = $2, "basePrice" = $3, "matchesPlayed" = $4,
           "totalRuns" = $5, "totalWickets" = $6, "teamId" = $7, "updatedAt" = now()
       WHERE id = $8 AND "ownerId" = $9
       RETURNING id`,
      [
        input.name,
        input.role,
        input.basePrice,
        input.matchesPlayed,
        input.totalRuns,
        input.totalWickets,
        input.teamId ?? null,
        id,
        ownerId,
      ],
    );

    const updatedPlayer = await client.query(
      `SELECT ${playerColumns} FROM players WHERE id = $1 AND "ownerId" = $2`,
      [updateRes.rows[0].id, ownerId],
    );
    if (!updatedPlayer.rows[0]) {
      throw new ServiceError(500, 'Could not read the updated player.');
    }
    await client.query('COMMIT');
    return formatPlayerRow(updatedPlayer.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deletePlayer(
  ownerId: string,
  id: string,
): Promise<boolean> {
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const player = await client.query(
      'SELECT id FROM players WHERE id = $1 AND "ownerId" = $2 FOR UPDATE',
      [id, ownerId],
    );
    if (!player.rows.length) throw new ServiceError(404, 'Player not found.');
    const referenced = await client.query(
      'SELECT 1 FROM performances WHERE "playerId" = $1 LIMIT 1',
      [id],
    );
    if (referenced.rows.length)
      throw new ServiceError(
        409,
        'This player has recorded match performances and cannot be deleted. Their match history must be preserved.',
      );
    await client.query('DELETE FROM players WHERE id = $1 AND "ownerId" = $2', [
      id,
      ownerId,
    ]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ----------------- Leaderboard Service -----------------

export async function getLeaderboard(
  ownerId: string,
  options: PlayerListQuery = playerListQuerySchema.parse({}),
): Promise<Paginated<RankedPlayerRecord>> {
  const input = playerListQuerySchema.parse(options);
  const filters = playerFilters(ownerId, input);
  // Calculate and rank the full owner-scoped roster in TypeScript so the
  // scoring function remains the only source of Impact Score rules.
  const result = await query<Record<string, unknown>>(
    `SELECT ${playerColumns} FROM players WHERE ${filters.where}`,
    filters.params,
  );
  const ranked = result.rows
    .map((row) => {
      const player = formatPlayerRow(row);
      return {
        ...player,
        score: calculateImpactScore(player),
        experienceStatus: getExperienceStatus(player.matchesPlayed),
      };
    })
    .sort((a, b) => {
      const sort = input.sort ?? 'impact';
      const direction = input.sort && input.direction === 'asc' ? 1 : -1;
      const compareText = (left: string, right: string) =>
        left < right ? -1 : left > right ? 1 : 0;
      const comparison =
        sort === 'impact'
          ? Math.round(a.score.total * 100) - Math.round(b.score.total * 100)
          : sort === 'name'
            ? compareText(a.name.toLowerCase(), b.name.toLowerCase())
            : sort === 'team'
              ? compareText(a.teamName.toLowerCase(), b.teamName.toLowerCase())
              : sort === 'matches'
                ? a.matchesPlayed - b.matchesPlayed
                : sort === 'runs'
                  ? a.totalRuns - b.totalRuns
                  : sort === 'wickets'
                    ? a.totalWickets - b.totalWickets
                    : a.basePrice - b.basePrice;
      if (comparison) return comparison * direction;
      const nameComparison = compareText(
        a.name.toLowerCase(),
        b.name.toLowerCase(),
      );
      return nameComparison || compareText(a.id, b.id);
    });
  const meta = paginationMeta(ranked.length, input);
  const start = (meta.page - 1) * meta.limit;
  return {
    data: ranked.slice(start, start + meta.limit),
    meta,
  };
}

// ----------------- Match Services -----------------

export function formatMatchRow(row: Record<string, unknown>): MatchRecord {
  const dateVal = row.playedAt;
  const dateStr =
    dateVal instanceof Date
      ? `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`
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

export async function getMatches(
  ownerId: string,
  options: PaginationInput = matchListQuerySchema.parse({}),
): Promise<Paginated<MatchRecord>> {
  const input = matchListQuerySchema.parse(options);
  const result = await paginatedRows(
    `SELECT matches.id, matches."teamA", matches."teamB", result, "playedAt"::text AS "playedAt", "submissionKey", "createdAt" FROM matches WHERE matches."ownerId" = $1`,
    '"playedAt" DESC, "createdAt" DESC, id DESC',
    [ownerId],
    input,
  );
  return { data: result.rows.map(formatMatchRow), meta: result.meta };
}

export async function getMatchById(
  ownerId: string,
  id: string,
): Promise<MatchDetailsRecord | null> {
  const matchResult = await query(
    `SELECT id, "teamA", "teamB", result, "playedAt"::text AS "playedAt"
     FROM matches
     WHERE id = $1 AND "ownerId" = $2`,
    [id, ownerId],
  );
  const matchRow = matchResult.rows[0];
  if (!matchRow) return null;

  const performanceResult = await query(
    `SELECT performances."teamSide", performances."playerId", players.name AS "playerName",
            players.role, performances.runs, performances.wickets
     FROM performances
     JOIN matches ON matches.id = performances."matchId"
     JOIN players ON players.id = performances."playerId"
     WHERE performances."matchId" = $1
       AND matches."ownerId" = $2
       AND players."ownerId" = $2
     ORDER BY performances."teamSide", lower(players.name) COLLATE "C", players.id`,
    [id, ownerId],
  );
  const details = formatMatchRow(matchRow);
  const teamAPerformances: MatchPerformanceRecord[] = [];
  const teamBPerformances: MatchPerformanceRecord[] = [];
  for (const row of performanceResult.rows) {
    const performance: MatchPerformanceRecord = {
      playerId: String(row.playerId),
      playerName: String(row.playerName),
      role: row.role as PlayerRecord['role'],
      runs: Number(row.runs),
      wickets: Number(row.wickets),
    };
    if (row.teamSide === 'A') teamAPerformances.push(performance);
    if (row.teamSide === 'B') teamBPerformances.push(performance);
  }
  return {
    ...details,
    teamAPerformances,
    teamBPerformances,
  };
}

export interface DashboardSummary {
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  totalRuns: number;
}

export async function getDashboardSummary(
  ownerId: string,
): Promise<DashboardSummary> {
  const res = await query<{
    totalPlayers: string;
    totalTeams: string;
    totalMatches: string;
    totalRuns: string;
  }>(
    `SELECT
      (SELECT count(*) FROM players WHERE "ownerId" = $1)::text AS "totalPlayers",
      (SELECT count(*) FROM teams WHERE "ownerId" = $1)::text AS "totalTeams",
      (SELECT count(*) FROM matches WHERE "ownerId" = $1)::text AS "totalMatches",
      (SELECT COALESCE(sum("totalRuns"), 0) FROM players WHERE "ownerId" = $1)::text AS "totalRuns"`,
    [ownerId],
  );
  const row = res.rows[0];
  if (!row) throw new ServiceError(500, 'Could not load summary.');
  return {
    totalPlayers: Number(row.totalPlayers),
    totalTeams: Number(row.totalTeams),
    totalMatches: Number(row.totalMatches),
    totalRuns: Number(row.totalRuns),
  };
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

    const teamsRes = await client.query<{ id: string; name: string }>(
      'SELECT id, name FROM teams WHERE "ownerId" = $1 AND name = ANY($2::text[])',
      [ownerId, [input.teamA, input.teamB]],
    );
    if (teamsRes.rows.length !== 2) {
      throw new ServiceError(
        400,
        'Both match teams must exist in your teams list.',
      );
    }
    const teamIds = new Map(teamsRes.rows.map((team) => [team.name, team.id]));
    if (teamIds.get(input.teamA) === teamIds.get(input.teamB)) {
      throw new ServiceError(400, 'Choose two different teams.');
    }

    // Insert match record
    const matchInsert = await client.query(
      `INSERT INTO matches ("ownerId", "teamAId", "teamBId", "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, "teamA", "teamB", result, "playedAt", "submissionKey"`,
      [
        ownerId,
        teamIds.get(input.teamA),
        teamIds.get(input.teamB),
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
      `SELECT id, "teamId", "matchesPlayed", "totalRuns", "totalWickets"
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
      const expectedTeamId =
        perf.teamSide === 'A'
          ? teamIds.get(input.teamA)
          : teamIds.get(input.teamB);
      if (p.teamId !== expectedTeamId) {
        throw new ServiceError(
          400,
          'Each player must be recorded for their assigned team side.',
        );
      }
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
        [
          createdMatch.id,
          perf.playerId,
          perf.teamSide,
          perf.runs,
          perf.wickets,
        ],
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
      const raceRes = await client.query(
        `SELECT id, "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash"
         FROM matches
         WHERE "ownerId" = $1 AND "submissionKey" = $2`,
        [ownerId, input.submissionKey],
      );
      const race = raceRes.rows[0];
      if (race && race.payloadHash === payloadHash) {
        return { match: formatMatchRow(race), replayed: true };
      }
      throw new ServiceError(
        409,
        'This submission key was already used for another match.',
      );
    }
    throw err;
  } finally {
    client.release();
  }
}
