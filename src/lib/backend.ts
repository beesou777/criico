import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser } from './session';
import { getLeaderboard, getPlayers, getPlayerById } from './services/players';
import { getMatches, getMatchById } from './services/matches';
import { getPlayerOptions, getTeams } from './services/teams';
import { getDashboardOverview } from './services/dashboard';
import type { PaginationInput, PlayerListQuery } from './pagination';

async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}
export async function authenticatedPlayers(options: PlayerListQuery) {
  const user = await requireSessionUser();
  return getPlayers(user.id, options);
}
export async function authenticatedLeaderboard(options: PlayerListQuery) {
  const user = await requireSessionUser();
  return getLeaderboard(user.id, options);
}
export async function authenticatedMatches(options: PaginationInput) {
  const user = await requireSessionUser();
  return getMatches(user.id, options);
}
export async function authenticatedPlayer(id: string) {
  const user = await requireSessionUser();
  return getPlayerById(user.id, id);
}
export async function authenticatedPlayerOptions() {
  const user = await requireSessionUser();
  return getPlayerOptions(user.id);
}
export async function authenticatedTeams() {
  const user = await requireSessionUser();
  return getTeams(user.id);
}
export async function authenticatedMatch(id: string) {
  const user = await requireSessionUser();
  return getMatchById(user.id, id);
}
export async function authenticatedDashboard() {
  const user = await requireSessionUser();
  return getDashboardOverview(user.id);
}
