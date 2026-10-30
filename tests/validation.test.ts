import { describe, expect, it } from 'vitest';
import {
  canonicalMatch,
  matchSchema,
  playerSchema,
  credentialsSchema,
  accountUpdateSchema,
  cricketToday,
} from '../src/lib/validation';

const validMatch = {
  teamA: 'Kathmandu XI',
  teamB: 'Lalitpur XI',
  result: 'A' as const,
  playedAt: '2025-01-01',
  submissionKey: 'c75ca846-1e59-4ac7-b6cc-d1d9f60e531f',
  performances: [
    {
      playerId: '405be0dc-9ae6-43d9-b612-d52f1b538709',
      teamSide: 'A' as const,
      runs: 0,
      wickets: 0,
    },
  ],
};

describe('Validation Boundaries', () => {
  it('uses Nepal match date correctly when UTC is on the previous day', () => {
    expect(cricketToday(new Date('2026-10-28T20:00:00Z'))).toBe('2026-10-29');
  });

  it('accepts a zero-stat participant and rejects duplicate players in a match', () => {
    expect(matchSchema.safeParse(validMatch).success).toBe(true);
    expect(
      matchSchema.safeParse({
        ...validMatch,
        performances: [...validMatch.performances, ...validMatch.performances],
      }).success,
    ).toBe(false);
  });

  it('rejects identical teams, future dates, negative runs, and fractional counts', () => {
    expect(
      matchSchema.safeParse({ ...validMatch, teamB: ' kathmandu xi ' }).success,
    ).toBe(false);
    expect(
      matchSchema.safeParse({ ...validMatch, playedAt: '2999-01-01' }).success,
    ).toBe(false);

    for (const runs of [-1, 0.5, Infinity]) {
      expect(
        matchSchema.safeParse({
          ...validMatch,
          performances: [{ ...validMatch.performances[0], runs }],
        }).success,
      ).toBe(false);
    }
  });

  it('enforces cricket wicket limits for players and innings', () => {
    expect(
      matchSchema.safeParse({
        ...validMatch,
        performances: [{ ...validMatch.performances[0], wickets: 11 }],
      }).success,
    ).toBe(false);
    expect(
      matchSchema.safeParse({
        ...validMatch,
        performances: [
          { ...validMatch.performances[0], wickets: 6 },
          {
            playerId: 'ff019dca-cc4e-49fc-ad18-7c3d111dd9b8',
            teamSide: 'A' as const,
            runs: 0,
            wickets: 5,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('limits each match team to a playing XI of 11 players', () => {
    const performances = Array.from({ length: 12 }, (_, index) => ({
      playerId: `405be0dc-9ae6-43d9-b612-d52f1b5387${String(index).padStart(2, '0')}`,
      teamSide: 'A' as const,
      runs: 0,
      wickets: 0,
    }));
    expect(matchSchema.safeParse({ ...validMatch, performances }).success).toBe(
      false,
    );
  });

  it('rejects mass-assignment of ownerId and invalid price decimal precision', () => {
    const player = {
      name: 'Paras Khadka',
      role: 'All-rounder' as const,
      basePrice: 100,
      matchesPlayed: 10,
      totalRuns: 500,
      totalWickets: 20,
    };
    expect(
      playerSchema.safeParse({ ...player, ownerId: 'injected-user-id' })
        .success,
    ).toBe(false);
    expect(
      playerSchema.safeParse({ ...player, basePrice: 1.234 }).success,
    ).toBe(false);
  });

  it('canonicalizes participant order for idempotent retry comparison', () => {
    const input = matchSchema.parse({
      ...validMatch,
      performances: [
        ...validMatch.performances,
        {
          playerId: 'ff019dca-cc4e-49fc-ad18-7c3d111dd9b8',
          teamSide: 'B' as const,
          runs: 45,
          wickets: 1,
        },
      ],
    });
    expect(canonicalMatch(input)).toBe(
      canonicalMatch({
        ...input,
        performances: [...input.performances].reverse(),
      }),
    );
  });

  it('normalizes email and rejects over-long passwords', () => {
    expect(
      credentialsSchema.parse({
        email: 'Organizer@Criico.com',
        password: 'securePassword123',
      }).email,
    ).toBe('organizer@criico.com');
  });

  it('requires the current password when changing an account password', () => {
    expect(
      accountUpdateSchema.safeParse({ newPassword: 'newPassword123' }).success,
    ).toBe(false);
    expect(
      accountUpdateSchema.safeParse({
        organizationName: 'Kathmandu Cricket Club',
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      }).success,
    ).toBe(true);
  });
});
