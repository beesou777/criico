// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import { getDb } from '../src/lib/db';
import {
  getPlayers,
  getLeaderboard,
  getMatches,
  getDashboardSummary,
} from '../src/lib/services';
import { playerListQuerySchema } from '../src/lib/pagination';
describe.skipIf(process.env.DATABASE_READONLY_CHECK !== 'true')(
  'Read-only PostgreSQL list verification',
  () => {
    afterAll(async () => {
      if (global.__dbPool) {
        await global.__dbPool.end();
        global.__dbPool = undefined;
      }
    });
    it('executes pagination SQL, validates ordering and full summary without writes', async () => {
      const db = getDb();
      let ownerId: string;
      try {
        const owner = await db.query<{ id: string }>(
          'SELECT "ownerId" AS id FROM players GROUP BY "ownerId" ORDER BY count(*) DESC LIMIT 1',
        );
        ownerId = owner.rows[0]?.id ?? '00000000-0000-4000-8000-000000000000';
      } catch {
        throw new Error(
          'Database connection failed with verified TLS. Check the connection and trusted certificate configuration.',
        );
      }
      const options = playerListQuerySchema.parse({ limit: '2' });
      const first = await getPlayers(ownerId, options);
      const second = await getPlayers(ownerId, { ...options, page: 2 });
      const summary = await getDashboardSummary(ownerId);
      expect(first.meta.totalItems).toBe(summary.totalPlayers);
      expect(first.data.length).toBeLessThanOrEqual(2);
      if (first.meta.totalPages > 1)
        expect(
          second.data.some((p) => first.data.some((q) => q.id === p.id)),
        ).toBe(false);
      const leaders = await getLeaderboard(ownerId, { ...options, limit: 100 });
      for (let i = 1; i < leaders.data.length; i++)
        expect(leaders.data[i - 1]!.score.total).toBeGreaterThanOrEqual(
          leaders.data[i]!.score.total,
        );
      const matches = await getMatches(ownerId, { page: 1, limit: 2 });
      expect(matches.meta.totalItems).toBe(summary.totalMatches);
      for (const match of matches.data)
        expect(match.playedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }, 30000);
  },
);
