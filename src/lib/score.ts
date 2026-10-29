import { z } from 'zod';

export const roles = [
  'Batsman',
  'Bowler',
  'All-rounder',
  'Wicketkeeper',
] as const;

export type Role = (typeof roles)[number];

const scoreInput = z.object({
  role: z.enum(roles),
  matchesPlayed: z.number().int().min(0),
  totalRuns: z.number().int().min(0),
  totalWickets: z.number().int().min(0),
});

export type ScoreInput = z.infer<typeof scoreInput>;

export interface ScoreBreakdown {
  total: number;
  runs: number;
  wickets: number;
  experience: number;
  keeper: number;
}

/**
 * Calculates the Cricket Impact Score based on the official Criico formula:
 * - Base Score: (Total Runs * 1.2) + (Total Wickets * 20)
 * - Role Multipliers:
 *     - Bowler: Wickets * 1.5 before adding (Wickets * 30)
 *     - Batsman: Runs * 1.3 before adding (Runs * 1.56)
 * - Experience Penalty / Bonus:
 *     - < 5 matches: -50 points (Rookie penalty)
 *     - > 20 matches: +100 points (Veteran bonus)
 * - Wicketkeeper Edge Case:
 *     - Flat +30 points. Wicketkeeper cannot have Bowler role multiplier.
 *
 * Uses hundredth-point integer arithmetic internally to avoid floating-point inaccuracies.
 */
export function calculateImpactScore(input: ScoreInput): ScoreBreakdown {
  const stats = scoreInput.parse(input);

  // Scaled by 100 (cents) to guarantee exact integer calculations
  const runsHundredths =
    stats.totalRuns * (stats.role === 'Batsman' ? 156 : 120);

  const wicketsHundredths =
    stats.totalWickets * (stats.role === 'Bowler' ? 3000 : 2000);

  const experienceHundredths =
    stats.matchesPlayed < 5 ? -5000 : stats.matchesPlayed > 20 ? 10000 : 0;

  const keeperHundredths = stats.role === 'Wicketkeeper' ? 3000 : 0;

  const totalHundredths =
    runsHundredths +
    wicketsHundredths +
    experienceHundredths +
    keeperHundredths;

  return {
    total: totalHundredths / 100,
    runs: runsHundredths / 100,
    wickets: wicketsHundredths / 100,
    experience: experienceHundredths / 100,
    keeper: keeperHundredths / 100,
  };
}
