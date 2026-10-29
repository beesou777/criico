// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { GET as getPlayersHandler, POST as createPlayerHandler } from '../src/app/api/players/route';
import { PUT as updatePlayerHandler, DELETE as deletePlayerHandler } from '../src/app/api/players/[id]/route';
import { GET as getMatchesHandler, POST as recordMatchHandler } from '../src/app/api/matches/route';
import { GET as leaderboardHandler } from '../src/app/api/leaderboard/route';
import { POST as logoutHandler } from '../src/app/api/auth/logout/route';
import type { PlayerRecord, RankedPlayerRecord, MatchRecord } from '../src/lib/services';

describe('Next.js API Endpoints End-to-End', () => {
  const testEmail = `organizer_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  let sessionToken = '';
  let playerId = '';

  it('POST /api/auth/register creates a new user and sets session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(testEmail);
    expect(body.token).toBeDefined();
    sessionToken = body.token;

    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toContain('criico_session');
    expect(cookieHeader?.toLowerCase()).toContain('httponly');
  });

  it('POST /api/auth/login validates credentials and issues JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(testEmail);
    expect(body.token).toBeDefined();
  });

  it('POST /api/players creates a new player with career stats', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sandeep Lamichhane',
        role: 'Bowler',
        basePrice: 50000,
        matchesPlayed: 4,
        totalRuns: 30,
        totalWickets: 12,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const res = await createPlayerHandler(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as PlayerRecord;
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Sandeep Lamichhane');
    expect(body.role).toBe('Bowler');
    expect(body.totalWickets).toBe(12);
    playerId = body.id;
  });

  it('GET /api/players fetches the organizer squad', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'GET',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    const res = await getPlayersHandler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as PlayerRecord[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((p) => p.id === playerId)).toBe(true);
  });

  it('PUT /api/players/[id] updates player statistics', async () => {
    const req = new NextRequest(`http://localhost:3000/api/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Sandeep Lamichhane',
        role: 'Bowler',
        basePrice: 60000,
        matchesPlayed: 5,
        totalRuns: 35,
        totalWickets: 15,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const res = await updatePlayerHandler(req, {
      params: Promise.resolve({ id: playerId }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PlayerRecord;
    expect(body.totalWickets).toBe(15);
    expect(body.basePrice).toBe(60000);
  });

  it('POST /api/matches records a match and increments player career totals atomically', async () => {
    const submissionKey = crypto.randomUUID();
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        teamA: 'Pokhara Rhinos',
        teamB: 'Biratnagar Kings',
        result: 'A',
        playedAt: '2025-05-10',
        submissionKey,
        performances: [
          {
            playerId,
            teamSide: 'A',
            runs: 10,
            wickets: 3,
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const res = await recordMatchHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.match.teamA).toBe('Pokhara Rhinos');
    expect(body.replayed).toBe(false);

    // Verify player stats were incremented:
    // matchesPlayed 5 + 1 = 6
    // totalRuns 35 + 10 = 45
    // totalWickets 15 + 3 = 18
    const getReq = new NextRequest('http://localhost:3000/api/players', {
      method: 'GET',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const playerRes = await getPlayersHandler(getReq);
    const players = (await playerRes.json()) as PlayerRecord[];
    const updated = players.find((p) => p.id === playerId);
    expect(updated?.matchesPlayed).toBe(6);
    expect(updated?.totalRuns).toBe(45);
    expect(updated?.totalWickets).toBe(18);
  });

  it('GET /api/matches fetches matches for the organizer', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'GET',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    const res = await getMatchesHandler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as MatchRecord[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/leaderboard returns players sorted by Custom Impact Score', async () => {
    const req = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    const res = await leaderboardHandler(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as RankedPlayerRecord[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);

    const playerOnBoard = body.find((p) => p.id === playerId);
    expect(playerOnBoard?.score).toBeDefined();
    // For Bowler with 6 matches, 45 runs, 18 wickets:
    // runs: 45 * 1.2 = 54
    // wickets: 18 * 20 * 1.5 = 540
    // experience: 0 (6 is between 5 and 20)
    // total: 54 + 540 = 594
    expect(playerOnBoard?.score.runs).toBe(54);
    expect(playerOnBoard?.score.wickets).toBe(540);
    expect(playerOnBoard?.score.experience).toBe(0);
    expect(playerOnBoard?.score.total).toBe(594);
  });

  it('DELETE /api/players/[id] deletes a player', async () => {
    const req = new NextRequest(`http://localhost:3000/api/players/${playerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    const res = await deletePlayerHandler(req, {
      params: Promise.resolve({ id: playerId }),
    });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/logout clears the session cookie', async () => {
    const res = await logoutHandler();
    expect(res.status).toBe(200);
    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toContain('criico_session=;');
  });
});
