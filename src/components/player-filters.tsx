'use client';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { roles } from '@/lib/contracts';
import type { Team } from '@/lib/contracts';
import type { PlayerListQuery } from '@/lib/pagination';
import { useListNavigation, navigateListLink } from './list-transition';

export function PlayerFilters({
  query,
  pathname,
  total,
  teams = [],
  showSort = true,
}: {
  query: PlayerListQuery;
  pathname: string;
  total: number;
  teams?: Team[];
  showSort?: boolean;
}) {
  const { pending, navigate } = useListNavigation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      limit: String(query.limit),
      page: '1',
    });
    const search = String(form.get('search') ?? '').trim();
    const role = String(form.get('role') ?? '');
    const teamId = String(form.get('teamId') ?? '');
    const sort = String(form.get('sort') ?? '');
    const direction = String(form.get('direction') ?? '');
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (teamId) params.set('teamId', teamId);
    if (showSort && sort) params.set('sort', sort);
    if (showSort && sort && direction) params.set('direction', direction);
    navigate(`${pathname}?${params.toString()}`);
  }
  return (
    <form
      action={pathname}
      onSubmit={submit}
      className="table-toolbar"
      key={`${query.search}:${query.role ?? ''}:${query.teamId ?? ''}:${query.sort ?? ''}:${query.direction ?? ''}`}
    >
      <input type="hidden" name="limit" value={query.limit} />
      <label className="search-field">
        <Search size={18} />
        <span className="sr-only">Search players</span>
        <input
          name="search"
          placeholder="Find a player…"
          maxLength={80}
          defaultValue={query.search}
        />
      </label>
      <label className="filter-field">
        <span className="sr-only">Filter by role</span>
        <select name="role" defaultValue={query.role ?? ''}>
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label className="filter-field">
        <span className="sr-only">Filter by team</span>
        <select name="teamId" defaultValue={query.teamId ?? ''}>
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      {showSort && (
        <>
          <label className="filter-field">
            <span className="sr-only">Sort players by</span>
            <select name="sort" defaultValue={query.sort ?? ''}>
              <option value="">Default order</option>
              <option value="impact">Impact score</option>
              <option value="name">Player name</option>
              <option value="team">Team</option>
              <option value="matches">Matches</option>
              <option value="runs">Runs</option>
              <option value="wickets">Wickets</option>
              <option value="basePrice">Base price</option>
            </select>
          </label>
          <label className="filter-field sort-direction">
            <span className="sr-only">Sort direction</span>
            <select
              name="direction"
              defaultValue={query.direction ?? 'desc'}
              aria-label="Sort direction"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </>
      )}
      <button
        className="button button-outline filter-submit"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Applying…' : 'Apply'}
      </button>
      {(query.search ||
        query.role ||
        query.teamId ||
        (showSort && (query.sort || query.direction))) && (
        <Link
          href={`${pathname}?limit=${query.limit}`}
          className="filter-reset"
          onClick={(event) =>
            navigateListLink(
              event,
              `${pathname}?limit=${query.limit}`,
              navigate,
            )
          }
        >
          Clear
        </Link>
      )}
      <span className="result-count" aria-live="polite">
        {total} players
      </span>
    </form>
  );
}
