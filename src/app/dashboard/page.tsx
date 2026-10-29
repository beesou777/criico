import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { authenticatedData, authenticatedSummary } from '@/lib/backend';
import {
  leaderboardPageSchema,
  matchPageSchema,
  numberFormat,
} from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';

export default async function DashboardPage() {
  const [leaderboardPage, matchPage, summary] = await Promise.all([
    authenticatedData('/api/leaderboard?limit=4').then((data) =>
      leaderboardPageSchema.parse(data),
    ),
    authenticatedData('/api/matches?limit=3').then((data) =>
      matchPageSchema.parse(data),
    ),
    authenticatedSummary(),
  ]);

  const topPlayers = leaderboardPage.data;
  const matches = matchPage.data;

  return (
    <>
      <PageHeading
        title="Your clubhouse."
        description="Your teams, matches, and player performances."
        action={
          <Link href="/dashboard/matches/new" className="button button-primary">
            <Plus size={18} />
            Record a match
          </Link>
        }
      />
      <section className="summary-row" aria-label="Clubhouse overview">
        <div>
          <span>Players in your roster</span>
          <strong>{summary.totalPlayers.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/players">
            Manage squad <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Teams in your club</span>
          <strong>{summary.totalTeams.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/teams">
            View teams <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Matches recorded</span>
          <strong>{summary.totalMatches.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/matches">
            Open matchbook <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Career runs across roster</span>
          <strong>{numberFormat.format(summary.totalRuns)}</strong>
          <Link href="/dashboard/leaderboard">
            Standings <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <div className="overview-grid">
        <section className="section-panel">
          <div className="section-heading">
            <h2>Top performances</h2>
            <Link href="/dashboard/leaderboard">
              Full leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
          {topPlayers.length ? (
            <div className="table-scroll">
              <table className="mini-leaderboard-table">
                <caption className="sr-only">
                  Top players ranked by Impact Score
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Player</th>
                    <th scope="col" className="numeric">
                      Runs
                    </th>
                    <th scope="col" className="numeric">
                      Wickets
                    </th>
                    <th scope="col" className="numeric">
                      Impact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, idx) => (
                    <tr key={player.id}>
                      <td>
                        <span
                          className={`rank${idx === 0 ? ' rank-first' : ''}`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td>
                        <div className="mini-player-cell">
                          <span className="mini-player-name">
                            {player.name}
                          </span>
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
                        {numberFormat.format(player.totalRuns)}
                      </td>
                      <td className="numeric font-tabular">
                        {player.totalWickets}
                      </td>
                      <td className="numeric">
                        <strong className="mini-impact-score">
                          {numberFormat.format(player.score.total)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Your first player starts the story."
              description="Add your squad to see top performances on the leaderboard."
              href="/dashboard/players/new"
              action="Add a player"
            />
          )}
        </section>
        <section className="section-panel">
          <div className="section-heading">
            <h2>Recent matches</h2>
            <Link href="/dashboard/matches">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {matches.length ? (
            <MatchList matches={matches.slice(0, 3)} />
          ) : (
            <EmptyState
              title="A fresh matchbook."
              description="Record a completed match to start building your squad’s history."
              href="/dashboard/matches/new"
              action="Record a match"
            />
          )}
        </section>
      </div>
    </>
  );
}
