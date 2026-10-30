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
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (teamId) params.set('teamId', teamId);
    if (showSort && sort) params.set('sort', sort);
    navigate(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      autoComplete="off"
      action={pathname}
      onSubmit={submit}
      className="table-toolbar flex items-center gap-[14px] p-[18px_22px] border-b border-border max-md:p-[14px] max-md:gap-[10px] max-md:flex-wrap"
      key={`${query.search}:${query.role ?? ''}:${query.teamId ?? ''}:${query.sort ?? ''}`}
    >
      <input type="hidden" name="limit" value={query.limit} />
      <label className="search-field flex flex-row items-center gap-2 border border-[#b9c4b2] rounded-[4px] pl-3 max-w-[330px] w-full bg-white max-md:max-w-none max-md:flex-1 max-md:min-w-[150px]">
        <Search size={18} className="text-secondary shrink-0" />
        <span className="sr-only">Search players</span>
        <input
          className="bg-transparent border-0 min-h-[40px] pl-0 text-xs text-ink outline-none w-full"
          name="search"
          placeholder="Find a player…"
          maxLength={80}
          defaultValue={query.search}
        />
      </label>
      <label className="filter-field min-w-[150px]">
        <span className="sr-only">Filter by role</span>
        <select
          className="min-h-[42px] p-[8px_30px_8px_12px] text-xs w-full rounded-[4px] border border-[#b9c4b2] bg-white text-ink"
          name="role"
          defaultValue={query.role ?? ''}
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label className="filter-field min-w-[150px]">
        <span className="sr-only">Filter by team</span>
        <select
          className="min-h-[42px] p-[8px_30px_8px_12px] text-xs w-full rounded-[4px] border border-[#b9c4b2] bg-white text-ink"
          name="teamId"
          defaultValue={query.teamId ?? ''}
        >
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
          <label className="filter-field min-w-[150px]">
            <span className="sr-only">Sort players by</span>
            <select
              className="min-h-[42px] p-[8px_30px_8px_12px] text-xs w-full rounded-[4px] border border-[#b9c4b2] bg-white text-ink"
              name="sort"
              defaultValue={query.sort ?? ''}
            >
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
        </>
      )}
      <button
        className="filter-submit button button-outline inline-flex justify-center items-center gap-2 min-h-[40px] p-[9px_15px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] bg-transparent hover:bg-soft text-[11px] whitespace-nowrap cursor-pointer transition-colors max-md:min-h-[42px]"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Applying…' : 'Apply'}
      </button>
      {(query.search ||
        query.role ||
        query.teamId ||
        (showSort && query.sort)) && (
        <Link
          href={`${pathname}?limit=${query.limit}`}
          className="filter-reset text-[11px] text-secondary underline hover:text-accent"
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
      <span
        className="result-count ml-auto text-[10px] text-secondary whitespace-nowrap max-md:w-full max-md:ml-0"
        aria-live="polite"
      >
        {total} players
      </span>
    </form>
  );
}
