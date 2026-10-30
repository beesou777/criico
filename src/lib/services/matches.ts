import { createHash } from 'node:crypto';
import { query, getDb } from '../db';
import {
  matchListQuerySchema,
  type PaginationInput,
  type Paginated,
} from '../pagination';
import {
  canonicalMatch,
  type MatchInput,
  type PerformanceInput,
} from '../validation';
import {
  formatMatchRow,
  isUniqueViolation,
  paginatedRows,
  ServiceError,
  type MatchDetailsRecord,
  type MatchPerformanceRecord,
  type MatchRecord,
  type PlayerRecord,
} from './shared';

export async function getMatches(
  ownerId: string,
  options: PaginationInput = matchListQuerySchema.parse({}),
): Promise<Paginated<MatchRecord>> {
  const input = matchListQuerySchema.parse(options);
  const result = await paginatedRows(
    `SELECT matches.id, matches."teamA", matches."teamB", result,
            matches."playedAt"::text AS "playedAt", matches."playedAt" AS "_playedAtSort",
            "submissionKey", "createdAt" FROM matches WHERE matches."ownerId" = $1`,
    '"_playedAtSort" DESC, "createdAt" DESC, id DESC',
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
      'SELECT id, name FROM teams WHERE "ownerId" = $1 AND "disbandedAt" IS NULL AND name = ANY($2::text[])',
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

    // Validate every locked player before writing any performance rows.
    const performanceRows: PerformanceInput[] = [];
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
      performanceRows.push(perf);
    }

    // Keep the transaction to a constant number of round trips as roster size grows.
    await client.query(
      `INSERT INTO performances ("matchId", "playerId", "teamSide", runs, wickets)
       SELECT $1, rows."playerId", rows."teamSide", rows.runs, rows.wickets
       FROM unnest($2::uuid[], $3::varchar[], $4::integer[], $5::integer[])
         AS rows("playerId", "teamSide", runs, wickets)`,
      [
        createdMatch.id,
        performanceRows.map((perf) => perf.playerId),
        performanceRows.map((perf) => perf.teamSide),
        performanceRows.map((perf) => perf.runs),
        performanceRows.map((perf) => perf.wickets),
      ],
    );
    await client.query(
      `UPDATE players AS player
       SET "matchesPlayed" = player."matchesPlayed" + 1,
           "totalRuns" = player."totalRuns" + rows.runs,
           "totalWickets" = player."totalWickets" + rows.wickets,
           "updatedAt" = now()
       FROM unnest($2::uuid[], $3::integer[], $4::integer[])
         AS rows("playerId", runs, wickets)
       WHERE player.id = rows."playerId" AND player."ownerId" = $1`,
      [
        ownerId,
        performanceRows.map((perf) => perf.playerId),
        performanceRows.map((perf) => perf.runs),
        performanceRows.map((perf) => perf.wickets),
      ],
    );

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
