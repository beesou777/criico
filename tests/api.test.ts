// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { NextRequest } from 'next/server';
import { POST as register } from '../src/app/api/auth/register/route';
import { POST as login } from '../src/app/api/auth/login/route';
import {
  GET as players,
  POST as createPlayer,
} from '../src/app/api/players/route';
import {
  GET as player,
  PUT as updatePlayer,
  DELETE as deletePlayer,
} from '../src/app/api/players/[id]/route';
import {
  GET as matches,
  POST as recordMatch,
} from '../src/app/api/matches/route';
import { GET as leaderboard } from '../src/app/api/leaderboard/route';
import { POST as logout } from '../src/app/api/auth/logout/route';
import { getDb } from '../src/lib/db';
import {
  playerPageSchema,
  leaderboardPageSchema,
  matchPageSchema,
  playerSchema,
} from '../src/lib/contracts';

const testDatabase = process.env.TEST_DATABASE_URL;
const localEnvironment = existsSync('.env')
  ? parseEnv(readFileSync('.env', 'utf8'))
  : {};
function databaseIdentity(value: string) {
  const url = new URL(value);
  return url.hostname + ':' + (url.port || '5432') + url.pathname;
}
for (const configured of [
  process.env.DATABASE_URL,
  localEnvironment.DATABASE_URL,
]) {
  if (
    testDatabase &&
    configured &&
    databaseIdentity(testDatabase) === databaseIdentity(configured)
  )
    throw new Error(
      'Use a dedicated TEST_DATABASE_URL, not the application database.',
    );
}
const origin = 'http://127.0.0.1:3100';
let token = '';
function request(
  path: string,
  method = 'GET',
  body?: unknown,
  session = token,
) {
  return new NextRequest(origin + path, {
    method,
    headers: {
      origin,
      'content-type': 'application/json',
      ...(session ? { cookie: 'criico_session=' + session } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const input = {
  name: 'Test player',
  role: 'Bowler',
  basePrice: 50,
  matchesPlayed: 4,
  totalRuns: 100,
  totalWickets: 10,
};
describe.skipIf(!testDatabase)(
  'Route handlers with an isolated PostgreSQL test database',
  () => {
    let userId = '';
    let otherUserId = '';
    let playerId = '';
    let otherPlayerId = '';
    const email = 'integration-' + crypto.randomUUID() + '@example.com';
    const password = 'test-password-123';
    beforeAll(async () => {
      process.env.DATABASE_URL = testDatabase;
      process.env.JWT_SECRET = 'isolated-test-signing-secret-at-least-32-chars';
      process.env.APP_ORIGIN = origin;
      const response = await register(
        request('/api/auth/register', 'POST', { email, password }, ''),
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.token).toBeUndefined();
      userId = body.user.id;
      token = response.cookies.get('criico_session')?.value ?? '';
      expect(token).not.toBe('');
      const other = await register(
        request(
          '/api/auth/register',
          'POST',
          { email: 'other-' + email, password },
          '',
        ),
      );
      otherUserId = (await other.json()).user.id;
      const seeded = await getDb().query(
        'INSERT INTO players ("ownerId",name,role,"basePrice","matchesPlayed","totalRuns","totalWickets") SELECT $1, concat(\'Player \',lpad(n::text,2,\'0\')),\'Bowler\',50,5,n,0 FROM generate_series(1,45) AS n RETURNING id',
        [userId],
      );
      playerId = seeded.rows[0].id;
      const otherPlayer = await getDb().query(
        'INSERT INTO players ("ownerId",name,role,"basePrice","matchesPlayed","totalRuns","totalWickets") VALUES ($1,\'Other player\',\'Bowler\',0,0,0,0) RETURNING id',
        [otherUserId],
      );
      otherPlayerId = otherPlayer.rows[0].id;
    }, 30000);
    afterAll(async () => {
      const db = getDb();
      for (const id of [userId, otherUserId])
        if (id) await db.query('DELETE FROM users WHERE id = $1', [id]);
      await db.end();
      global.__dbPool = undefined;
    }, 30000);
    it('keeps JWTs out of JSON and sets the HTTP-only cookie at login', async () => {
      const response = await login(
        request('/api/auth/login', 'POST', { email, password }, ''),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).not.toHaveProperty('token');
      expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    });
    it('counts, clamps, filters, and orders full player lists before paging', async () => {
      const first = playerPageSchema.parse(
        await (await players(request('/api/players?page=1&limit=20'))).json(),
      );
      const second = playerPageSchema.parse(
        await (await players(request('/api/players?page=2&limit=20'))).json(),
      );
      expect(first.meta).toEqual({
        page: 1,
        limit: 20,
        totalItems: 45,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
        nextPage: 2,
        previousPage: null,
      });
      expect(second.data).toHaveLength(20);
      expect(
        second.data.some((p) => first.data.some((q) => q.id === p.id)),
      ).toBe(false);
      const filtered = playerPageSchema.parse(
        await (
          await players(request('/api/players?search=Player%2045'))
        ).json(),
      );
      expect(filtered.meta.totalItems).toBe(1);
      expect(filtered.data[0]?.name).toBe('Player 45');
      const last = playerPageSchema.parse(
        await (await players(request('/api/players?page=999&limit=20'))).json(),
      );
      expect(last.meta.page).toBe(3);
      expect(last.data).toHaveLength(5);
    });
    it('ranks globally before slicing leaderboard pages', async () => {
      const result = leaderboardPageSchema.parse(
        await (
          await leaderboard(request('/api/leaderboard?page=2&limit=20'))
        ).json(),
      );
      expect(result.meta.totalItems).toBe(45);
      expect(result.data[0]?.totalRuns).toBe(25);
      expect(result.data[19]?.totalRuns).toBe(6);
      for (const entry of result.data)
        expect(entry.score.total).toBe(entry.totalRuns * 1.2);
    });
    it('preserves timestamp precision and requires the version for updates', async () => {
      const detail = playerSchema.parse(
        await (
          await player(request('/api/players/' + playerId), {
            params: Promise.resolve({ id: playerId }),
          })
        ).json(),
      );
      const response = await updatePlayer(
        request('/api/players/' + playerId, 'PUT', {
          ...input,
          expectedUpdatedAt: detail.updatedAt,
        }),
        { params: Promise.resolve({ id: playerId }) },
      );
      expect(response.status).toBe(200);
      expect(
        (
          await updatePlayer(
            request('/api/players/' + playerId, 'PUT', input),
            { params: Promise.resolve({ id: playerId }) },
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await updatePlayer(
            request('/api/players/' + playerId, 'PUT', {
              ...input,
              expectedUpdatedAt: detail.updatedAt,
            }),
            { params: Promise.resolve({ id: playerId }) },
          )
        ).status,
      ).toBe(409);
    });
    it('records a match once under concurrent retries and keeps its calendar date', async () => {
      const payload = {
        teamA: 'Team A',
        teamB: 'Team B',
        result: 'A',
        playedAt: '2025-01-01',
        submissionKey: crypto.randomUUID(),
        performances: [{ playerId, teamSide: 'A', runs: 10, wickets: 2 }],
      };
      const responses = await Promise.all([
        recordMatch(request('/api/matches', 'POST', payload)),
        recordMatch(request('/api/matches', 'POST', payload)),
      ]);
      expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
      const detail = playerSchema.parse(
        await (
          await player(request('/api/players/' + playerId), {
            params: Promise.resolve({ id: playerId }),
          })
        ).json(),
      );
      expect(detail.matchesPlayed).toBe(5);
      expect(detail.totalRuns).toBe(110);
      expect(detail.totalWickets).toBe(12);
      const history = matchPageSchema.parse(
        await (await matches(request('/api/matches'))).json(),
      );
      expect(history.meta.totalItems).toBe(1);
      expect(history.data[0]?.playedAt).toBe('2025-01-01');
      expect(
        (
          await recordMatch(
            request('/api/matches', 'POST', { ...payload, result: 'B' }),
          )
        ).status,
      ).toBe(409);
      expect(
        (
          await deletePlayer(request('/api/players/' + playerId, 'DELETE'), {
            params: Promise.resolve({ id: playerId }),
          })
        ).status,
      ).toBe(409);
    });
    it('rejects other owners and rolls back a match with an unavailable participant', async () => {
      expect(
        (
          await player(request('/api/players/' + otherPlayerId), {
            params: Promise.resolve({ id: otherPlayerId }),
          })
        ).status,
      ).toBe(404);
      const response = await recordMatch(
        request('/api/matches', 'POST', {
          teamA: 'Team A',
          teamB: 'Team B',
          result: 'TIE',
          playedAt: '2025-01-01',
          submissionKey: crypto.randomUUID(),
          performances: [
            { playerId, teamSide: 'A', runs: 9, wickets: 0 },
            { playerId: otherPlayerId, teamSide: 'B', runs: 9, wickets: 0 },
          ],
        }),
      );
      expect(response.status).toBe(404);
      const history = matchPageSchema.parse(
        await (await matches(request('/api/matches'))).json(),
      );
      expect(history.meta.totalItems).toBe(1);
    });
    it('creates and deletes an unreferenced owned player', async () => {
      const created = await createPlayer(
        request('/api/players', 'POST', input),
      );
      expect(created.status).toBe(201);
      const id = (await created.json()).id;
      expect(
        (
          await deletePlayer(request('/api/players/' + id, 'DELETE'), {
            params: Promise.resolve({ id }),
          })
        ).status,
      ).toBe(200);
    });
    it('rejects cookie mutations from a foreign origin and clears the logout cookie', async () => {
      const foreign = new NextRequest(origin + '/api/players', {
        method: 'POST',
        headers: {
          origin: 'https://foreign.example',
          cookie: 'criico_session=' + token,
          'content-type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      expect((await createPlayer(foreign)).status).toBe(403);
      expect(
        (await logout(request('/api/auth/logout', 'POST'))).headers.get(
          'set-cookie',
        ),
      ).toContain('Max-Age=0');
    });
  },
);
