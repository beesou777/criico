import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser } from './session';
import {
  getLeaderboard,
  getPlayers,
  getMatches,
  getPlayerById,
  getPlayerOptions,
  getDashboardSummary,
  getTeams,
} from './services';
import {
  playerListQuerySchema,
  matchListQuerySchema,
  urlQuery,
} from './pagination';
export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}
export async function authenticatedData(path: string) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const url = new URL(path, 'http://internal');
  if (url.pathname === '/api/leaderboard')
    return getLeaderboard(
      user.id,
      playerListQuerySchema.parse(urlQuery(url.searchParams)),
    );
  if (url.pathname === '/api/players')
    return getPlayers(
      user.id,
      playerListQuerySchema.parse(urlQuery(url.searchParams)),
    );
  if (url.pathname === '/api/matches')
    return getMatches(
      user.id,
      matchListQuerySchema.parse(urlQuery(url.searchParams)),
    );
  throw new BackendError(404, 'Unknown data endpoint.');
}
export async function authenticatedPlayer(id: string) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return getPlayerById(user.id, id);
}
export async function authenticatedPlayerOptions() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return getPlayerOptions(user.id);
}
export async function authenticatedTeams() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return getTeams(user.id);
}
export async function authenticatedSummary() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return getDashboardSummary(user.id);
}
