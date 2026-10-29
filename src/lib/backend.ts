import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser } from './session';
import {
  getLeaderboard,
  getPlayers,
  getMatches,
} from './services';

export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

/**
 * Server Component data fetcher:
 * Authenticates session directly on the server and retrieves organizer data from PostgreSQL.
 * Eliminates loopback HTTP fetch overhead while maintaining the server component boundary.
 */
export async function authenticatedData(path: string) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const cleanPath = path.split('?')[0];

  if (cleanPath === '/api/leaderboard') {
    return await getLeaderboard(user.id);
  }
  if (cleanPath === '/api/players') {
    return await getPlayers(user.id);
  }
  if (cleanPath === '/api/matches') {
    return await getMatches(user.id);
  }

  throw new BackendError(404, `Unknown data endpoint: ${path}`);
}
