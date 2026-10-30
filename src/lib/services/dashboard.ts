import { query } from '../db';
import {
  formatMatchRow,
  formatPlayerRow,
  playerColumns,
  ServiceError,
  type MatchRecord,
  type PlayerRecord,
} from './shared';

export interface DashboardSummary {
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  totalRuns: number;
}

export interface DashboardOverview extends DashboardSummary {
  topRunScorers: PlayerRecord[];
  topWicketTakers: PlayerRecord[];
  recentMatches: MatchRecord[];
}

/** Load the dashboard in one database round trip instead of three lists plus a summary. */
export async function getDashboardOverview(
  ownerId: string,
): Promise<DashboardOverview> {
  const result = await query<{
    totalPlayers: string;
    totalTeams: string;
    totalMatches: string;
    totalRuns: string;
    topRunScorers: Record<string, unknown>[];
    topWicketTakers: Record<string, unknown>[];
    recentMatches: Record<string, unknown>[];
  }>(
    `SELECT
       (SELECT count(*) FROM players WHERE "ownerId" = $1)::text AS "totalPlayers",
       (SELECT count(*) FROM teams WHERE "ownerId" = $1 AND "disbandedAt" IS NULL)::text AS "totalTeams",
       (SELECT count(*) FROM matches WHERE "ownerId" = $1)::text AS "totalMatches",
       (SELECT COALESCE(sum("totalRuns"), 0) FROM players WHERE "ownerId" = $1)::text AS "totalRuns",
       (SELECT COALESCE(json_agg(item), '[]'::json) FROM (
         SELECT ${playerColumns} FROM players
         WHERE "ownerId" = $1
         ORDER BY "totalRuns" DESC, lower(name) COLLATE "C", id
         LIMIT 4
       ) item) AS "topRunScorers",
       (SELECT COALESCE(json_agg(item), '[]'::json) FROM (
         SELECT ${playerColumns} FROM players
         WHERE "ownerId" = $1
         ORDER BY "totalWickets" DESC, lower(name) COLLATE "C", id
         LIMIT 4
       ) item) AS "topWicketTakers",
       (SELECT COALESCE(json_agg(item), '[]'::json) FROM (
         SELECT matches.id, matches."teamA", matches."teamB", matches.result,
                matches."playedAt"::text AS "playedAt"
         FROM matches WHERE matches."ownerId" = $1
         ORDER BY matches."playedAt" DESC, matches."createdAt" DESC, matches.id DESC
         LIMIT 3
       ) item) AS "recentMatches"`,
    [ownerId],
  );
  const row = result.rows[0];
  if (!row) throw new ServiceError(500, 'Could not load dashboard.');
  return {
    totalPlayers: Number(row.totalPlayers),
    totalTeams: Number(row.totalTeams),
    totalMatches: Number(row.totalMatches),
    totalRuns: Number(row.totalRuns),
    topRunScorers: row.topRunScorers.map(formatPlayerRow),
    topWicketTakers: row.topWicketTakers.map(formatPlayerRow),
    recentMatches: row.recentMatches.map(formatMatchRow),
  };
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
      (SELECT count(*) FROM teams WHERE "ownerId" = $1 AND "disbandedAt" IS NULL)::text AS "totalTeams",
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
