'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TeamRecord } from '@/lib/services/shared';
import { TeamActions } from './team-actions';

export function TeamTable({ teams }: { teams: TeamRecord[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'active' | 'disbanded' | 'all'>(
    'active',
  );
  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        const matchesSearch = team.name
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesStatus =
          status === 'all' ||
          (status === 'active' ? !team.disbandedAt : Boolean(team.disbandedAt));
        return matchesSearch && matchesStatus;
      }),
    [search, status, teams],
  );

  return (
    <>
      <div className="table-toolbar mt-5 flex flex-wrap items-center gap-[14px] border-b border-border pb-[18px] max-md:gap-[10px]">
        <label className="flex min-h-[42px] min-w-[220px] max-w-[330px] flex-1 flex-row items-center gap-2 rounded-[4px] border border-[#b9c4b2] bg-white pl-3 max-md:max-w-none">
          <Search size={18} className="shrink-0 text-secondary" />
          <span className="sr-only">Search teams</span>
          <input
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a team..."
            className="min-h-[40px] w-full border-0 bg-transparent pl-0 text-xs font-normal text-ink outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Filter teams by status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="min-h-[42px] min-w-[150px] rounded-[4px] border border-[#b9c4b2] bg-white p-[8px_30px_8px_12px] text-xs text-ink"
          >
            <option value="active">Active teams</option>
            <option value="disbanded">Disbanded teams</option>
            <option value="all">All teams</option>
          </select>
        </label>
        <span
          className="result-count ml-auto whitespace-nowrap text-[10px] text-secondary max-md:ml-0"
          aria-live="polite"
        >
          {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
        </span>
      </div>
      {filteredTeams.length ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-soft text-[10px] uppercase tracking-[0.08em] text-secondary">
              <tr>
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold">Players</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTeams.map((team) => (
                <tr
                  className={team.disbandedAt ? 'bg-soft/40' : 'bg-card'}
                  key={team.id}
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-bold text-foreground hover:text-accent"
                      href={`/dashboard/players?teamId=${encodeURIComponent(team.id)}`}
                    >
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {team.playerCount}{' '}
                    {team.playerCount === 1 ? 'player' : 'players'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-soft px-2 py-1 text-[10px] font-semibold text-secondary">
                      {team.disbandedAt ? 'Disbanded' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TeamActions
                      teamId={team.id}
                      teamName={team.name}
                      playerCount={team.playerCount}
                      disbanded={Boolean(team.disbandedAt)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pt-5 text-xs text-secondary">
          No teams match your filters.
        </p>
      )}
    </>
  );
}
