const { Client } = require('pg');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(254) NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(80) NOT NULL,
        role varchar(20) NOT NULL CHECK (role IN ('Batsman','Bowler','All-rounder','Wicketkeeper')),
        "basePrice" numeric(12,2) NOT NULL CHECK ("basePrice" >= 0 AND "basePrice" <= 1000000000),
        "matchesPlayed" integer NOT NULL CHECK ("matchesPlayed" BETWEEN 0 AND 10000000),
        "totalRuns" integer NOT NULL CHECK ("totalRuns" BETWEEN 0 AND 10000000),
        "totalWickets" integer NOT NULL CHECK ("totalWickets" BETWEEN 0 AND 10000000),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS players_owner ON players ("ownerId");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "teamA" varchar(80) NOT NULL,
        "teamB" varchar(80) NOT NULL,
        result varchar(12) NOT NULL CHECK (result IN ('A','B','TIE','NO_RESULT')),
        "playedAt" date NOT NULL,
        "submissionKey" uuid NOT NULL,
        "payloadHash" varchar(64) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("ownerId", "submissionKey")
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS matches_owner ON matches ("ownerId");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS performances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "matchId" uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        "playerId" uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        "teamSide" varchar(1) NOT NULL CHECK ("teamSide" IN ('A','B')),
        runs integer NOT NULL CHECK (runs BETWEEN 0 AND 10000000),
        wickets integer NOT NULL CHECK (wickets BETWEEN 0 AND 10000000),
        UNIQUE ("matchId", "playerId")
      );
    `);

    console.log('All tables created successfully!');
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    console.log('Public tables in database:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();
