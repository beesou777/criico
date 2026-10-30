import { z } from 'zod';
import { query } from '../db';
import {
  paginationMeta,
  type PaginationInput,
  type PlayerListQuery,
} from '../pagination';
import type { ScoreBreakdown, ExperienceStatus } from '../score';

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
  organizationName: string;
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
  disbandedAt?: string | null;
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
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}
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

export const playerColumns = `id, name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets",
  "teamId", (SELECT name FROM teams WHERE teams.id = "teamId") AS "teamName",
  to_char("updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"`;

export function playerFilters(ownerId: string, input: PlayerListQuery) {
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

export function playerOrder(input: PlayerListQuery, leaderboard = false) {
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
export async function paginatedRows(
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
    `WITH filtered AS NOT MATERIALIZED (${filteredSQL}), counted AS (SELECT count(*) AS total FROM filtered)
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
