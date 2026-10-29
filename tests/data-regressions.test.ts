// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { formatMatchRow, formatPlayerRow } from '../src/lib/services';
import {
  credentialsSchema,
  matchSchema,
  playerUpdateSchema,
} from '../src/lib/validation';
vi.mock('../src/lib/db', () => ({ query: vi.fn(), getDb: vi.fn() }));
const player = {
  id: '405be0dc-9ae6-43d9-b612-d52f1b538709',
  name: 'Aarav',
  role: 'Bowler',
  basePrice: '20.00',
  matchesPlayed: 5,
  totalRuns: 10,
  totalWickets: 1,
  updatedAt: '2026-10-29T09:00:00.123456Z',
};
describe('Data boundary regressions', () => {
  it('preserves database timestamp microseconds and Date milliseconds', () => {
    expect(formatPlayerRow(player).updatedAt).toBe(player.updatedAt);
    expect(
      formatPlayerRow({
        ...player,
        updatedAt: new Date('2026-10-29T09:00:00.123Z'),
      }).updatedAt,
    ).toBe('2026-10-29T09:00:00.123Z');
  });
  it('requires a valid update version', () => {
    const input = {
      name: 'Aarav',
      role: 'Bowler',
      basePrice: 0,
      matchesPlayed: 0,
      totalRuns: 0,
      totalWickets: 0,
      teamId: player.id,
    };
    expect(playerUpdateSchema.safeParse(input).success).toBe(false);
    expect(
      playerUpdateSchema.safeParse({ ...input, expectedUpdatedAt: 'invalid' })
        .success,
    ).toBe(false);
    expect(
      playerUpdateSchema.safeParse({
        ...input,
        expectedUpdatedAt: player.updatedAt,
      }).success,
    ).toBe(true);
  });
  it('keeps a date-only match value on the same calendar day', () => {
    const match = {
      id: player.id,
      teamA: 'Team A',
      teamB: 'Team B',
      result: 'A',
      playedAt: '2026-10-29',
    };
    expect(formatMatchRow(match).playedAt).toBe('2026-10-29');
    expect(
      formatMatchRow({ ...match, playedAt: new Date(2026, 9, 29) }).playedAt,
    ).toBe('2026-10-29');
  });
  it('rejects impossible calendar dates and accepts leap days', () => {
    const match = {
      teamA: 'Team A',
      teamB: 'Team B',
      result: 'A',
      submissionKey: player.id,
      performances: [
        { playerId: player.id, teamSide: 'A', runs: 0, wickets: 0 },
      ],
    };
    for (const playedAt of ['2025-02-29', '2026-02-31', '2025-13-01'])
      expect(matchSchema.safeParse({ ...match, playedAt }).success).toBe(false);
    expect(
      matchSchema.safeParse({ ...match, playedAt: '2024-02-29' }).success,
    ).toBe(true);
  });
  it('applies the eight-character and UTF-8 byte boundaries consistently', () => {
    expect(
      credentialsSchema.safeParse({
        email: 'player@example.com',
        password: '12345678',
      }).success,
    ).toBe(true);
    expect(
      credentialsSchema.safeParse({
        email: 'player@example.com',
        password: '1234567',
      }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: 'player@example.com',
        password: '界'.repeat(25),
      }).success,
    ).toBe(false);
  });
});
