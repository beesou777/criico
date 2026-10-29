import { Pool, type QueryResult, type QueryResultRow } from 'pg';

declare global {
  var __dbPool: Pool | undefined;
}

export function getDb(): Pool {
  if (!global.__dbPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined.');
    }
    global.__dbPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  }
  return global.__dbPool;
}

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<R>> {
  const pool = getDb();
  return pool.query<R>(text, params);
}
