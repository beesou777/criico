import { z } from 'zod';
import { paginationMetaSchema } from './pagination';
export const roles = [
  'Batsman',
  'Bowler',
  'All-rounder',
  'Wicketkeeper',
] as const;
export const playerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: z.enum(roles),
  basePrice: z.number(),
  matchesPlayed: z.number(),
  totalRuns: z.number(),
  totalWickets: z.number(),
  teamId: z.uuid(),
  teamName: z.string(),
  updatedAt: z.string(),
});
export const scoreSchema = z.object({
  total: z.number(),
  runs: z.number(),
  wickets: z.number(),
  experience: z.number(),
  keeper: z.number(),
});
export const rankedPlayerSchema = playerSchema.extend({ score: scoreSchema });
export const cricketMatchSchema = z.object({
  id: z.uuid(),
  teamA: z.string(),
  teamB: z.string(),
  result: z.enum(['A', 'B', 'TIE', 'NO_RESULT']),
  playedAt: z.string(),
});
export const playerPageSchema = z.object({
  data: z.array(playerSchema),
  meta: paginationMetaSchema,
});
export const leaderboardPageSchema = z.object({
  data: z.array(rankedPlayerSchema),
  meta: paginationMetaSchema,
});
export const matchPageSchema = z.object({
  data: z.array(cricketMatchSchema),
  meta: paginationMetaSchema,
});
export type PlayerOption = Pick<
  z.infer<typeof playerSchema>,
  'id' | 'name' | 'role' | 'teamId' | 'teamName'
>;
export const teamSchema = z.object({ id: z.uuid(), name: z.string() });
export type Team = z.infer<typeof teamSchema>;
export type Player = z.infer<typeof playerSchema>;
export type RankedPlayer = z.infer<typeof rankedPlayerSchema>;
export type CricketMatch = z.infer<typeof cricketMatchSchema>;
export const numberFormat = new Intl.NumberFormat('en-NP', {
  maximumFractionDigits: 2,
});
export function matchResult(match: CricketMatch) {
  return match.result === 'A'
    ? `${match.teamA} won`
    : match.result === 'B'
      ? `${match.teamB} won`
      : match.result === 'TIE'
        ? 'Match tied'
        : 'No result';
}
export function errorMessage(
  body: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const parsed = z
    .object({ error: z.object({ message: z.string() }) })
    .safeParse(body);
  return parsed.success ? parsed.data.error.message : fallback;
}
