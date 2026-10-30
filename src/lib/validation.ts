import { z } from 'zod';
import { roles, type Role } from './score';

export { roles, type Role };

export const count = z
  .number()
  .int('Must be an integer.')
  .min(0, 'Statistics must be zero or greater.')
  .max(10_000_000, 'Exceeds supported statistics limit.');

export function cricketToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export const credentialsSchema = z
  .object({
    email: z
      .string()
      .email('Enter a valid email address.')
      .max(254)
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use at most 72 characters.')
      .refine(
        (v) => Buffer.byteLength(v, 'utf8') <= 72,
        'Password must be at most 72 UTF-8 bytes.',
      ),
  })
  .strict();

export const registrationSchema = credentialsSchema
  .extend({
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organization name must have at least 2 characters.')
      .max(80, 'Organization name must be 80 characters or fewer.'),
  })
  .strict();

export const accountUpdateSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organization name must have at least 2 characters.')
      .max(80)
      .optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use at most 72 characters.')
      .optional(),
  })
  .strict()
  .refine((value) => !value.newPassword || Boolean(value.currentPassword), {
    path: ['currentPassword'],
    message: 'Enter your current password to set a new password.',
  });

export const playerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must have at least 2 characters.')
      .max(80, 'Name must be 80 characters or fewer.'),
    role: z.enum(roles),
    basePrice: z
      .number()
      .min(0, 'Base price must be zero or greater.')
      .max(1_000_000_000, 'Base price cannot exceed 1,000,000,000.')
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
        'Base price must have at most two decimal places.',
      ),
    matchesPlayed: count,
    totalRuns: count,
    totalWickets: count,
    teamId: z.string().uuid('Choose a team.'),
  })
  .strict();

export const playerUpdateSchema = playerSchema.extend({
  expectedUpdatedAt: z.iso.datetime(),
});

export const performanceSchema = z
  .object({
    playerId: z.string().uuid('Invalid player ID.'),
    teamSide: z.enum(['A', 'B']),
    runs: count,
    wickets: count.max(
      10,
      'A player cannot take more than 10 wickets in one match.',
    ),
  })
  .strict();

export const matchSchema = z
  .object({
    teamA: z
      .string()
      .trim()
      .min(2, 'Team A must have at least 2 characters.')
      .max(80),
    teamB: z
      .string()
      .trim()
      .min(2, 'Team B must have at least 2 characters.')
      .max(80),
    result: z.enum(['A', 'B', 'TIE', 'NO_RESULT']),
    playedAt: z.iso.date('Enter a valid calendar date in YYYY-MM-DD format.'),
    submissionKey: z.string().uuid('Invalid submission key.'),
    performances: z
      .array(performanceSchema)
      .min(1, 'Select at least one participating player.')
      .max(100, 'Cannot exceed 100 player performances.'),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.teamA.toLowerCase() === value.teamB.toLowerCase()) {
      ctx.addIssue({
        code: 'custom',
        path: ['teamB'],
        message: 'Choose two different teams.',
      });
    }
    const playerIds = value.performances.map((p) => p.playerId);
    if (new Set(playerIds).size !== playerIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['performances'],
        message: 'A player can appear only once in a match.',
      });
    }
    for (const teamSide of ['A', 'B'] as const) {
      const teamPlayers = value.performances.filter(
        (performance) => performance.teamSide === teamSide,
      );
      if (teamPlayers.length > 11) {
        ctx.addIssue({
          code: 'custom',
          path: ['performances'],
          message: `Team ${teamSide} cannot have more than 11 players in a match.`,
        });
      }
      const wickets = value.performances
        .filter((performance) => performance.teamSide === teamSide)
        .reduce((total, performance) => total + performance.wickets, 0);
      if (wickets > 10) {
        ctx.addIssue({
          code: 'custom',
          path: ['performances'],
          message: `${teamSide === 'A' ? value.teamA : value.teamB} cannot record more than 10 wickets in this innings.`,
        });
      }
    }
    if (value.playedAt > cricketToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['playedAt'],
        message: 'A completed match cannot be in the future.',
      });
    }
  });

export type PlayerInput = z.infer<typeof playerSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type PerformanceInput = z.infer<typeof performanceSchema>;

export function canonicalMatch(input: MatchInput): string {
  return JSON.stringify({
    ...input,
    performances: [...input.performances].sort((a, b) =>
      a.playerId.localeCompare(b.playerId),
    ),
  });
}
