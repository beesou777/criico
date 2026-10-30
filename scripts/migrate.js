const { Client } = require('pg');
const { databaseOptions } = require('./database-options.cjs');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const client = new Client({
    ...databaseOptions(connectionString),
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(254) NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "organizationName" varchar(80) NOT NULL DEFAULT 'Grassroots Cricket Manager',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "organizationName" varchar(80) NOT NULL DEFAULT 'Grassroots Cricket Manager';
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
      CREATE INDEX IF NOT EXISTS players_owner_name_idx
        ON players ("ownerId", (lower(name) COLLATE "C"), id);
      CREATE INDEX IF NOT EXISTS players_owner_runs_idx
        ON players ("ownerId", "totalRuns" DESC, (lower(name) COLLATE "C"), id);
      CREATE INDEX IF NOT EXISTS players_owner_wickets_idx
        ON players ("ownerId", "totalWickets" DESC, (lower(name) COLLATE "C"), id);
      CREATE INDEX IF NOT EXISTS players_owner_impact_desc_idx
        ON players (
          "ownerId",
          (
            "totalRuns"::bigint * CASE WHEN role = 'Batsman' THEN 156 ELSE 120 END +
            "totalWickets"::bigint * CASE WHEN role = 'Bowler' THEN 3000 ELSE 2000 END +
            CASE WHEN "matchesPlayed" < 5 THEN -5000 WHEN "matchesPlayed" > 20 THEN 10000 ELSE 0 END +
            CASE WHEN role = 'Wicketkeeper' THEN 3000 ELSE 0 END
          ) DESC,
          (lower(name) COLLATE "C"), id
        );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(80) NOT NULL,
        "disbandedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("ownerId", name)
      );
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS "disbandedAt" timestamptz;
      ALTER TABLE players ADD COLUMN IF NOT EXISTS "teamId" uuid REFERENCES teams(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS players_team ON players ("teamId");
      CREATE INDEX IF NOT EXISTS players_owner_team_idx ON players ("ownerId", "teamId");
    `);

    await client.query(`
      INSERT INTO teams ("ownerId", name)
      SELECT DISTINCT "ownerId", 'Unassigned Team' FROM players
      WHERE "teamId" IS NULL
      ON CONFLICT ("ownerId", name) DO NOTHING;
      UPDATE players
      SET "teamId" = teams.id
      FROM teams
      WHERE players."ownerId" = teams."ownerId"
        AND teams.name = 'Unassigned Team'
        AND players."teamId" IS NULL;
      ALTER TABLE players ALTER COLUMN "teamId" SET NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "teamAId" uuid REFERENCES teams(id),
        "teamBId" uuid REFERENCES teams(id),
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
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS "teamAId" uuid REFERENCES teams(id);
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS "teamBId" uuid REFERENCES teams(id);
      INSERT INTO teams ("ownerId", name)
      SELECT "ownerId", "teamA" FROM matches
      ON CONFLICT ("ownerId", name) DO NOTHING;
      INSERT INTO teams ("ownerId", name)
      SELECT "ownerId", "teamB" FROM matches
      ON CONFLICT ("ownerId", name) DO NOTHING;
      UPDATE matches
      SET "teamAId" = teams.id
      FROM teams
      WHERE matches."ownerId" = teams."ownerId" AND matches."teamA" = teams.name AND matches."teamAId" IS NULL;
      UPDATE matches
      SET "teamBId" = teams.id
      FROM teams
      WHERE matches."ownerId" = teams."ownerId" AND matches."teamB" = teams.name AND matches."teamBId" IS NULL;
      ALTER TABLE matches ALTER COLUMN "teamAId" SET NOT NULL;
      ALTER TABLE matches ALTER COLUMN "teamBId" SET NOT NULL;
      CREATE INDEX IF NOT EXISTS matches_team_a ON matches ("teamAId");
      CREATE INDEX IF NOT EXISTS matches_team_b ON matches ("teamBId");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS matches_owner ON matches ("ownerId");
      CREATE INDEX IF NOT EXISTS matches_owner_played_at_idx
        ON matches ("ownerId", "playedAt" DESC, "createdAt" DESC, id DESC);
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

    await client.query(`
      CREATE INDEX IF NOT EXISTS performances_player_idx
        ON performances ("playerId");
    `);

    console.log('All tables created successfully!');
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    console.log(
      'Public tables in database:',
      res.rows.map((r) => r.table_name),
    );
  } catch (err) {
    console.error(
      'Migration failed:',
      err instanceof Error ? err.name : 'UnknownError',
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();
