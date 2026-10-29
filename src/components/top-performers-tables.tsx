'use client';

import { useState } from 'react';
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
    <div className="perf-tables-container">
      <div className="perf-tabs-bar">
        <div className="perf-tabs" role="tablist" aria-label="Discipline filter">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'both'}
            className={`perf-tab${activeTab === 'both' ? ' active' : ''}`}
            onClick={() => setActiveTab('both')}
          >
            Both
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'batting'}
            className={`perf-tab${activeTab === 'batting' ? ' active' : ''}`}
            onClick={() => setActiveTab('batting')}
          >
            Batting (Runs)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bowling'}
            className={`perf-tab${activeTab === 'bowling' ? ' active' : ''}`}
            onClick={() => setActiveTab('bowling')}
          >
            Bowling (Wickets)
          </button>
        </div>
      </div>

      {showBatting && displayedBatters.length > 0 && (
        <div className="table-block">
          <div className="table-block-header">
            <span className="discipline-pill batting-pill">Batting</span>
            <h3 className="table-block-title">Top Run Scorers</h3>
          </div>
          <div className="table-scroll">
            <table className="mini-leaderboard-table">
              <caption className="sr-only">Top players by career runs</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '48px' }}>
                    Rank
                  </th>
                  <th scope="col">Player</th>
                  <th scope="col" className="numeric" style={{ width: '70px' }}>
                    Matches
                  </th>
                  <th scope="col" className="numeric" style={{ width: '80px' }}>
                    Runs
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedBatters.map((player, idx) => (
                  <tr key={player.id}>
                    <td>
                      <span className={`rank${idx === 0 ? ' rank-first' : ''}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td>
                      <div className="mini-player-cell">
                        <span className="mini-player-name">{player.name}</span>
                        <div className="mini-player-meta">
                          <span className="mini-role-tag">{player.role}</span>
                          {player.teamName ? (
                            <span className="mini-team-name">
                              {player.teamName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="numeric font-tabular">
                      {player.matchesPlayed}
                    </td>
                    <td className="numeric">
                      <strong className="stat-highlight-runs">
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
        <div className="table-block">
          <div className="table-block-header">
            <span className="discipline-pill bowling-pill">Bowling</span>
            <h3 className="table-block-title">Top Wicket Takers</h3>
          </div>
          <div className="table-scroll">
            <table className="mini-leaderboard-table">
              <caption className="sr-only">Top players by career wickets</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '48px' }}>
                    Rank
                  </th>
                  <th scope="col">Player</th>
                  <th scope="col" className="numeric" style={{ width: '70px' }}>
                    Matches
                  </th>
                  <th scope="col" className="numeric" style={{ width: '80px' }}>
                    Wickets
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedBowlers.map((player, idx) => (
                  <tr key={player.id}>
                    <td>
                      <span className={`rank${idx === 0 ? ' rank-first' : ''}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td>
                      <div className="mini-player-cell">
                        <span className="mini-player-name">{player.name}</span>
                        <div className="mini-player-meta">
                          <span className="mini-role-tag">{player.role}</span>
                          {player.teamName ? (
                            <span className="mini-team-name">
                              {player.teamName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="numeric font-tabular">
                      {player.matchesPlayed}
                    </td>
                    <td className="numeric">
                      <strong className="stat-highlight-wickets">
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
