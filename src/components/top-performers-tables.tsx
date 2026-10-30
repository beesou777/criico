'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Player } from '@/lib/contracts';
import { numberFormat } from '@/lib/contracts';
import { EmptyState } from '@/components/empty-state';

export function TopPerformersTables({
  batters,
  bowlers,
}: {
  batters: Player[];
  bowlers: Player[];
}) {
  const [activeTab, setActiveTab] = useState<'both' | 'batting' | 'bowling'>(
    'both',
  );

  if (!batters.length && !bowlers.length) {
    return (
      <EmptyState
        title="Your first player starts the story."
        description="Add your squad to see top run scorers and wicket takers."
        href="/dashboard/players/new"
        action="Add a player"
      />
    );
  }

  const showBatting = activeTab === 'both' || activeTab === 'batting';
  const showBowling = activeTab === 'both' || activeTab === 'bowling';
  const batLimit = activeTab === 'both' ? 3 : 4;
  const bowlLimit = activeTab === 'both' ? 3 : 4;

  const displayedBatters = batters.slice(0, batLimit);
  const displayedBowlers = bowlers.slice(0, bowlLimit);

  return (
    <div>
      <div className="py-2.5 px-4.5 bg-[#fbf9f4] border-b border-border">
        <div
          className="flex gap-1.5"
          role="tablist"
          aria-label="Discipline filter"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'both'}
            className={clsx(
              'border text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-colors duration-150',
              activeTab === 'both'
                ? 'bg-card text-foreground border-border [box-shadow:0_1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent border-transparent text-secondary hover:text-foreground hover:bg-background',
            )}
            onClick={() => setActiveTab('both')}
          >
            Both
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'batting'}
            className={clsx(
              'border text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-colors duration-150',
              activeTab === 'batting'
                ? 'bg-card text-foreground border-border [box-shadow:0_1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent border-transparent text-secondary hover:text-foreground hover:bg-background',
            )}
            onClick={() => setActiveTab('batting')}
          >
            Batting (Runs)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bowling'}
            className={clsx(
              'border text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-colors duration-150',
              activeTab === 'bowling'
                ? 'bg-card text-foreground border-border [box-shadow:0_1px_2px_rgba(0,0,0,0.04)]'
                : 'bg-transparent border-transparent text-secondary hover:text-foreground hover:bg-background',
            )}
            onClick={() => setActiveTab('bowling')}
          >
            Bowling (Wickets)
          </button>
        </div>
      </div>

      {showBatting && displayedBatters.length > 0 && (
        <div className="border-b border-border last:border-b-0">
          <div className="flex items-center gap-2 pt-3 px-4.5 pb-2 bg-background">
            <span className="text-[9px] font-bold tracking-[0.05em] uppercase px-1.5 py-0.5 rounded bg-[#fdf5e8] text-[#875508] border border-[#eed9b5]">
              Batting
            </span>
            <h3 className="text-xs font-bold tracking-tight text-foreground m-0">
              Top Run Scorers
            </h3>
          </div>
          <div className="relative overflow-x-auto max-md:w-full">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Top players by career runs
              </caption>
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    scope="col"
                    style={{ width: '48px' }}
                  >
                    Rank
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    scope="col"
                  >
                    Player
                  </th>
                  <th
                    scope="col"
                    className="text-right tabular-nums px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    style={{ width: '70px' }}
                  >
                    Matches
                  </th>
                  <th
                    scope="col"
                    className="text-right tabular-nums px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    style={{ width: '80px' }}
                  >
                    Runs
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedBatters.map((player, idx) => (
                  <tr className="hover:bg-[#faf7f2] transition-colors" key={player.id}>
                    <td className="px-4 py-3 border-t border-border align-middle">
                      <span
                        className={clsx(
                          'tabular-nums text-sm font-semibold',
                          idx === 0 ? 'text-[#875508]' : 'text-secondary',
                        )}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-t border-border align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-foreground leading-tight">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                          <span className="inline-block bg-[#f9e8ed] text-[#9b1836] rounded-[2px] text-[9px] font-semibold px-1 py-0.25 leading-snug">
                            {player.role}
                          </span>
                          {player.teamName ? (
                            <span className="text-secondary text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-30">
                              {player.teamName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="text-right tabular-nums px-4 py-3 border-t border-border align-middle text-xs text-foreground">
                      {player.matchesPlayed}
                    </td>
                    <td className="text-right tabular-nums px-4 py-3 border-t border-border align-middle">
                      <strong className="text-[#7a4c00] font-extrabold text-[13px] tabular-nums">
                        {numberFormat.format(player.totalRuns)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBowling && displayedBowlers.length > 0 && (
        <div className="border-b border-border last:border-b-0">
          <div className="flex items-center gap-2 pt-3 px-4.5 pb-2 bg-background">
            <span className="text-[9px] font-bold tracking-[0.05em] uppercase px-1.5 py-0.5 rounded bg-[#f3ecf9] text-[#52247f] border border-[#d9c5ed]">
              Bowling
            </span>
            <h3 className="text-xs font-bold tracking-tight text-foreground m-0">
              Top Wicket Takers
            </h3>
          </div>
          <div className="relative overflow-x-auto max-md:w-full">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Top players by career wickets
              </caption>
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    scope="col"
                    style={{ width: '48px' }}
                  >
                    Rank
                  </th>
                  <th
                    className="px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    scope="col"
                  >
                    Player
                  </th>
                  <th
                    scope="col"
                    className="text-right tabular-nums px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    style={{ width: '70px' }}
                  >
                    Matches
                  </th>
                  <th
                    scope="col"
                    className="text-right tabular-nums px-4 py-3 text-[9px] font-bold tracking-[0.06em] uppercase text-secondary bg-[#f4f6ee] border-b border-border"
                    style={{ width: '80px' }}
                  >
                    Wickets
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedBowlers.map((player, idx) => (
                  <tr className="hover:bg-[#faf7f2] transition-colors" key={player.id}>
                    <td className="px-4 py-3 border-t border-border align-middle">
                      <span
                        className={clsx(
                          'tabular-nums text-sm font-semibold',
                          idx === 0 ? 'text-[#52247f]' : 'text-secondary',
                        )}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-t border-border align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-foreground leading-tight">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                          <span className="inline-block bg-[#f9e8ed] text-[#9b1836] rounded-[2px] text-[9px] font-semibold px-1 py-0.25 leading-snug">
                            {player.role}
                          </span>
                          {player.teamName ? (
                            <span className="text-secondary text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-30">
                              {player.teamName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="text-right tabular-nums px-4 py-3 border-t border-border align-middle text-xs text-foreground">
                      {player.matchesPlayed}
                    </td>
                    <td className="text-right tabular-nums px-4 py-3 border-t border-border align-middle">
                      <strong className="text-[#4a1f73] font-extrabold text-[13px] tabular-nums">
                        {player.totalWickets}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
