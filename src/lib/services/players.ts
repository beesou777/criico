import { query, getDb } from '../db';
import {
  playerListQuerySchema,
  type PlayerListQuery,
  type Paginated,
} from '../pagination';
import { calculateImpactScore } from '../score';
import type { PlayerInput, PlayerUpdateInput } from '../validation';
import {
  formatPlayerRow,
  paginatedRows,
  playerColumns,
  playerFilters,
  playerOrder,
  ServiceError,
  type PlayerRecord,
  type RankedPlayerRecord,
} from './shared';

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
  // Rank the entire filtered roster before LIMIT/OFFSET, never just one page.
  const result = await paginatedRows(
    `SELECT ${playerColumns}, (
    "totalRuns"::bigint * CASE WHEN role = 'Batsman' THEN 156 ELSE 120 END +
    "totalWickets"::bigint * CASE WHEN role = 'Bowler' THEN 3000 ELSE 2000 END +
    CASE WHEN "matchesPlayed" < 5 THEN -5000 WHEN "matchesPlayed" > 20 THEN 10000 ELSE 0 END +
    CASE WHEN role = 'Wicketkeeper' THEN 3000 ELSE 0 END
  ) AS "scoreHundredths" FROM players WHERE ${filters.where}`,
    playerOrder(input, true),
    filters.params,
    input,
  );
  return {
    data: result.rows.map((row) => {
      const player = formatPlayerRow(row);
      return { ...player, score: calculateImpactScore(player) };
    }),
    meta: result.meta,
  };
}
