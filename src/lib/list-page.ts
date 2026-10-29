import 'server-only';
import { redirect } from 'next/navigation';
export function normalizePage(
  pathname: string,
  query: { page: number; limit: number; search?: string; role?: string },
  actualPage: number,
) {
  if (query.page !== actualPage)
    redirect(`${pathname}?${listQueryString({ ...query, page: actualPage })}`);
}
import {
  matchListQuerySchema,
  playerListQuerySchema,
  type SearchParams,
} from './pagination';

export function playerPageQuery(search: SearchParams, pathname: string) {
  const parsed = playerListQuerySchema.safeParse({
    ...search,
    role: search.role === '' ? undefined : search.role,
    teamId: search.teamId === '' ? undefined : search.teamId,
  });
  if (!parsed.success) redirect(pathname);
  return parsed.data;
}
export function matchPageQuery(search: SearchParams) {
  const parsed = matchListQuerySchema.safeParse(search);
  if (!parsed.success) redirect('/dashboard/matches');
  return parsed.data;
}
export function listQueryString(query: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  teamId?: string;
  sort?: string;
  direction?: string;
}) {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set('search', query.search);
  if (query.role) params.set('role', query.role);
  if (query.teamId) params.set('teamId', query.teamId);
  if (query.sort) params.set('sort', query.sort);
  if (query.direction) params.set('direction', query.direction);
  return params.toString();
}
