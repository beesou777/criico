// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { canonicalMatch } from '../src/lib/validation';
import {
  updatePlayer,
  deletePlayer,
  recordMatch,
  getDashboardSummary,
  getTeams,
} from '../src/lib/services';
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  clientQuery: vi.fn(),
  release: vi.fn(),
}));
vi.mock('../src/lib/db', () => ({
  query: mocks.query,
  getDb: () => ({
    connect: async () => ({ query: mocks.clientQuery, release: mocks.release }),
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReset();
  mocks.clientQuery.mockReset();
});
const ownerId = '405be0dc-9ae6-43d9-b612-d52f1b538709';
const version = '2026-10-29T09:00:00.123456Z';
const input = {
  name: 'Aarav',
  role: 'Bowler' as const,
  basePrice: 0,
  matchesPlayed: 5,
  totalRuns: 100,
  totalWickets: 10,
  teamId: '8c9a7d6e-5b4c-43a2-91d0-0f1e2d3c4b5a',
  expectedUpdatedAt: version,
};
describe('Transactional service regressions', () => {
  it('loads owner-scoped teams with grouped actual player counts', async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [
        { id: 'team-1', name: 'Lions', playerCount: '12' },
        { id: 'team-2', name: 'Yaks', playerCount: '0' },
      ],
    });

    await expect(getTeams(ownerId)).resolves.toEqual([
      { id: 'team-1', name: 'Lions', playerCount: 12 },
      { id: 'team-2', name: 'Yaks', playerCount: 0 },
    ]);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining('players."ownerId" = teams."ownerId"'),
      [ownerId],
    );
    expect(mocks.query.mock.calls[0]?.[0]).toContain(
      'WHERE teams."ownerId" = $1',
    );
    expect(mocks.query.mock.calls[0]?.[0]).toContain(
      'GROUP BY teams.id, teams.name',
    );
  });

  it('accepts an unchanged microsecond timestamp and releases the transaction', async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: ownerId, updatedAt: version }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })
      .mockResolvedValueOnce({
        rows: [{ id: ownerId }],
      })
      .mockResolvedValueOnce({
        rows: [
          { ...input, id: ownerId, teamName: 'Team A', updatedAt: version },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });
    expect((await updatePlayer(ownerId, ownerId, input)).updatedAt).toBe(
      version,
    );
    expect(mocks.clientQuery).toHaveBeenCalledWith('COMMIT');
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('rejects a stale edit even if only microseconds differ and rolls back', async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: ownerId, updatedAt: '2026-10-29T09:00:00.123457Z' }],
      })
      .mockResolvedValueOnce({ rows: [] });
    await expect(updatePlayer(ownerId, ownerId, input)).rejects.toMatchObject({
      status: 409,
    });
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('keeps a referenced player and their match performances', async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: ownerId }] })
      .mockResolvedValueOnce({ rows: [{ exists: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(deletePlayer(ownerId, ownerId)).rejects.toMatchObject({
      status: 409,
    });
    expect(
      mocks.clientQuery.mock.calls.some(([sql]) =>
        String(sql).startsWith('DELETE'),
      ),
    ).toBe(false);
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
  });
  it('rolls back the inserted match if a participant is unavailable', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          { id: 'team-a', name: 'Team A' },
          { id: 'team-b', name: 'Team B' },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: ownerId }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(
      recordMatch(ownerId, {
        teamA: 'Team A',
        teamB: 'Team B',
        result: 'A',
        playedAt: '2025-01-01',
        submissionKey: ownerId,
        performances: [
          { playerId: ownerId, teamSide: 'A', runs: 0, wickets: 0 },
        ],
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(
      mocks.clientQuery.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO performances'),
      ),
    ).toBe(false);
  });
  it('rolls back match transaction if player is assigned to the wrong team side', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          { id: 'team-a', name: 'Team A' },
          { id: 'team-b', name: 'Team B' },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'match-1' }] }) // match insert
      .mockResolvedValueOnce({
        // player lock: returns player with teamId = 'team-b'
        rows: [
          {
            id: ownerId,
            teamId: 'team-b',
            matchesPlayed: 5,
            totalRuns: 100,
            totalWickets: 10,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
    await expect(
      recordMatch(ownerId, {
        teamA: 'Team A',
        teamB: 'Team B',
        result: 'A',
        playedAt: '2025-01-01',
        submissionKey: ownerId,
        performances: [
          // Submitting on teamSide 'A', but player is in team-b
          { playerId: ownerId, teamSide: 'A', runs: 0, wickets: 0 },
        ],
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Each player must be recorded for their assigned team side.',
    });
    expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK');
  });
  it('replays response idempotently without re-entering transaction when submission key matches', async () => {
    const matchInput = {
      teamA: 'Team A',
      teamB: 'Team B',
      result: 'A' as const,
      playedAt: '2025-01-01',
      submissionKey: ownerId,
      performances: [
        { playerId: ownerId, teamSide: 'A' as const, runs: 0, wickets: 0 },
      ],
    };
    const expectedHash = createHash('sha256')
      .update(canonicalMatch(matchInput))
      .digest('hex');

    const matchRow = {
      id: 'match-1',
      teamA: 'Team A',
      teamB: 'Team B',
      result: 'A',
      playedAt: '2025-01-01',
      submissionKey: ownerId,
      payloadHash: expectedHash,
    };
    mocks.query.mockResolvedValueOnce({
      rows: [matchRow],
    });

    const res = await recordMatch(ownerId, matchInput);

    expect(res.replayed).toBe(true);
    expect(res.match.id).toBe('match-1');
    // Database transaction connect was never called
    expect(mocks.clientQuery).not.toHaveBeenCalled();
  });
  it('aggregates dashboard summary scoped to the authenticated owner', async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [
        {
          totalPlayers: '14',
          totalTeams: '2',
          totalMatches: '5',
          totalRuns: '1420',
        },
      ],
    });

    const summary = await getDashboardSummary(ownerId);

    expect(summary).toEqual({
      totalPlayers: 14,
      totalTeams: 2,
      totalMatches: 5,
      totalRuns: 1420,
    });
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE "ownerId" = $1'),
      [ownerId],
    );
  });
});
