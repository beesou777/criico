const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database for seeding.');

    const email = 'bishwa@yopmail.com';
    const plainPassword = 'Test@123';
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    // 1. Upsert Showcase User
    const userRes = await client.query(
      `INSERT INTO users (email, "passwordHash")
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"
       RETURNING id, email`,
      [email, passwordHash],
    );

    const user = userRes.rows[0];
    console.log(`Showcase user ready: ${user.email} (${user.id})`);

    // 2. Clean existing players/matches for this user to ensure idempotency
    await client.query(`DELETE FROM players WHERE "ownerId" = $1`, [user.id]);
    await client.query(`DELETE FROM matches WHERE "ownerId" = $1`, [user.id]);
    console.log('Cleaned previous demo data for user.');

    // 3. Insert NPL (Nepal Premier League) Players
    // Roles: Batsman, Bowler, All-rounder, Wicketkeeper
    // Demonstrates:
    // - Veteran bonus (> 20 matches, +100 pts): Rohit, Dipendra, Sandeep, Aasif, Karan, Sompal, Kushal B.
    // - Neutral experience (5-20 matches): Kushal M., Anil, Lalit, Gulshan, Bhim.
    // - Rookie penalty (< 5 matches, -50 pts): Pratish, Rijan, Hemant.
    // - Wicketkeeper bonus (+30 pts flat, no bowler multiplier): Aasif Sheikh, Anil Sah.
    // - Bowler multiplier (* 1.5): Sandeep, Lalit, Pratish, Rijan, Hemant.
    // - Batsman multiplier (* 1.3): Rohit, Kushal B., Bhim.
    const nplPlayers = [
      {
        name: 'Dipendra Singh Airee',
        role: 'All-rounder',
        basePrice: 2500000,
        matchesPlayed: 24,
        totalRuns: 1480,
        totalWickets: 38,
      },
      {
        name: 'Sandeep Lamichhane',
        role: 'Bowler',
        basePrice: 2500000,
        matchesPlayed: 25,
        totalRuns: 180,
        totalWickets: 74,
      },
      {
        name: 'Kushal Bhurtel',
        role: 'Batsman',
        basePrice: 2000000,
        matchesPlayed: 21,
        totalRuns: 1320,
        totalWickets: 15,
      },
      {
        name: 'Rohit Kumar Paudel',
        role: 'Batsman',
        basePrice: 2500000,
        matchesPlayed: 22,
        totalRuns: 1250,
        totalWickets: 12,
      },
      {
        name: 'Aasif Sheikh',
        role: 'Wicketkeeper',
        basePrice: 2000000,
        matchesPlayed: 21,
        totalRuns: 1120,
        totalWickets: 0,
      },
      {
        name: 'Sompal Kami',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 22,
        totalRuns: 640,
        totalWickets: 42,
      },
      {
        name: 'Karan KC',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 23,
        totalRuns: 580,
        totalWickets: 45,
      },
      {
        name: 'Kushal Malla',
        role: 'All-rounder',
        basePrice: 2000000,
        matchesPlayed: 19,
        totalRuns: 960,
        totalWickets: 22,
      },
      {
        name: 'Anil Kumar Sah',
        role: 'Wicketkeeper',
        basePrice: 1500000,
        matchesPlayed: 18,
        totalRuns: 890,
        totalWickets: 0,
      },
      {
        name: 'Lalit Rajbanshi',
        role: 'Bowler',
        basePrice: 1500000,
        matchesPlayed: 18,
        totalRuns: 45,
        totalWickets: 36,
      },
      {
        name: 'Gulshan Jha',
        role: 'All-rounder',
        basePrice: 1500000,
        matchesPlayed: 15,
        totalRuns: 620,
        totalWickets: 24,
      },
      {
        name: 'Bhim Sharki',
        role: 'Batsman',
        basePrice: 1200000,
        matchesPlayed: 14,
        totalRuns: 710,
        totalWickets: 2,
      },
      {
        name: 'Pratish GC',
        role: 'Bowler',
        basePrice: 1000000,
        matchesPlayed: 4,
        totalRuns: 65,
        totalWickets: 9,
      },
      {
        name: 'Rijan Dhakal',
        role: 'Bowler',
        basePrice: 800000,
        matchesPlayed: 3,
        totalRuns: 12,
        totalWickets: 7,
      },
      {
        name: 'Hemant Dhami',
        role: 'Bowler',
        basePrice: 750000,
        matchesPlayed: 2,
        totalRuns: 8,
        totalWickets: 5,
      },
    ];

    const playerMap = new Map();

    for (const p of nplPlayers) {
      const res = await client.query(
        `INSERT INTO players ("ownerId", name, role, "basePrice", "matchesPlayed", "totalRuns", "totalWickets")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, role`,
        [user.id, p.name, p.role, p.basePrice, p.matchesPlayed, p.totalRuns, p.totalWickets],
      );
      const inserted = res.rows[0];
      playerMap.set(inserted.name, inserted.id);
    }

    console.log(`Inserted ${nplPlayers.length} NPL players into squad.`);

    // 4. Insert NPL Matches & Performances
    const matches = [
      {
        teamA: 'Janakpur Bolts',
        teamB: 'Sudurpaschim Royals',
        result: 'A',
        playedAt: '2024-12-01',
        performances: [
          { name: 'Aasif Sheikh', teamSide: 'A', runs: 68, wickets: 0 },
          { name: 'Lalit Rajbanshi', teamSide: 'A', runs: 0, wickets: 3 },
          { name: 'Dipendra Singh Airee', teamSide: 'B', runs: 45, wickets: 2 },
          { name: 'Hemant Dhami', teamSide: 'B', runs: 6, wickets: 1 },
        ],
      },
      {
        teamA: 'Kathmandu Gurkhas',
        teamB: 'Chitwan Rhinos',
        result: 'A',
        playedAt: '2024-12-03',
        performances: [
          { name: 'Bhim Sharki', teamSide: 'A', runs: 54, wickets: 0 },
          { name: 'Karan KC', teamSide: 'A', runs: 28, wickets: 3 },
          { name: 'Kushal Malla', teamSide: 'B', runs: 39, wickets: 1 },
          { name: 'Pratish GC', teamSide: 'B', runs: 12, wickets: 2 },
        ],
      },
      {
        teamA: 'Biratnagar Kings',
        teamB: 'Pokhara Avengers',
        result: 'B',
        playedAt: '2024-12-05',
        performances: [
          { name: 'Kushal Bhurtel', teamSide: 'B', runs: 76, wickets: 1 },
          { name: 'Sandeep Lamichhane', teamSide: 'A', runs: 14, wickets: 4 },
          { name: 'Rijan Dhakal', teamSide: 'A', runs: 2, wickets: 1 },
        ],
      },
      {
        teamA: 'Lumbini Lions',
        teamB: 'Karnali Yaks',
        result: 'A',
        playedAt: '2024-12-07',
        performances: [
          { name: 'Rohit Kumar Paudel', teamSide: 'A', runs: 85, wickets: 1 },
          { name: 'Sompal Kami', teamSide: 'B', runs: 34, wickets: 2 },
          { name: 'Gulshan Jha', teamSide: 'B', runs: 26, wickets: 1 },
        ],
      },
    ];

    for (const m of matches) {
      const submissionKey = crypto.randomUUID();
      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ teamA: m.teamA, teamB: m.teamB, playedAt: m.playedAt }))
        .digest('hex');

      const matchRes = await client.query(
        `INSERT INTO matches ("ownerId", "teamA", "teamB", result, "playedAt", "submissionKey", "payloadHash")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [user.id, m.teamA, m.teamB, m.result, m.playedAt, submissionKey, payloadHash],
      );
      const matchId = matchRes.rows[0].id;

      for (const perf of m.performances) {
        const playerId = playerMap.get(perf.name);
        if (playerId) {
          await client.query(
            `INSERT INTO performances ("matchId", "playerId", "teamSide", runs, wickets)
             VALUES ($1, $2, $3, $4, $5)`,
            [matchId, playerId, perf.teamSide, perf.runs, perf.wickets],
          );
        }
      }
    }

    console.log(`Inserted ${matches.length} NPL matches with player performances.`);
    console.log('\n--- SEED COMPLETE ---');
    console.log('Login credentials for showcase:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${plainPassword}`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
