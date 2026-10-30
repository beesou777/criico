'use client';

import Link from 'next/link';
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
      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <label className="flex min-w-[220px] flex-1 items-center rounded-md border border-[#b9c4b2] bg-white px-3">
          <span className="sr-only">Search teams</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teams..."
            className="min-h-10 w-full bg-transparent text-xs text-ink outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Filter teams by status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="min-h-10 rounded-md border border-[#b9c4b2] bg-white px-3 text-xs text-ink"
          >
            <option value="active">Active teams</option>
            <option value="disbanded">Disbanded teams</option>
            <option value="all">All teams</option>
          </select>
        </label>
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
