import { authenticatedLeaderboard, authenticatedTeams } from '@/lib/backend';
import { leaderboardPageSchema, numberFormat } from '@/lib/contracts';
import { Pagination } from '@/components/pagination';
import { PlayerFilters } from '@/components/player-filters';
import {
  playerPageQuery,
  listQueryString,
  normalizePage,
} from '@/lib/list-page';
import type { SearchParams } from '@/lib/pagination';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { ListTransition } from '@/components/list-transition';
import Link from 'next/link';

export const metadata = { title: 'Leaderboard' };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = playerPageQuery(await searchParams, '/dashboard/leaderboard');
  const [leaderboardData, teams] = await Promise.all([
    authenticatedLeaderboard(query),
    authenticatedTeams(),
  ]);
  const result = leaderboardPageSchema.parse(leaderboardData);
  const players = result.data;
  normalizePage('/dashboard/leaderboard', query, result.meta.page);
  const offset = (result.meta.page - 1) * result.meta.limit;
  const selectedSort = query.sort ?? 'impact';
  const selectedDirection = query.sort ? (query.direction ?? 'desc') : 'desc';
  const sortHref = (field: string) => {
    const params = new URLSearchParams(listQueryString({ ...query, page: 1 }));
    const active = query.sort === field;
    params.set('sort', field);
    params.set(
      'direction',
      active && query.direction === 'asc' ? 'desc' : 'asc',
    );
    return `/dashboard/leaderboard?${params.toString()}`;
  };

  const sortLabel = (label: string, field: string) => (
    <Link
      className="inline-flex items-center gap-1 text-inherit hover:text-accent transition-colors"
      href={sortHref(field)}
    >
      {label}
      <span aria-hidden="true">
        {selectedSort === field
          ? selectedDirection === 'asc'
            ? ' ↑'
            : ' ↓'
          : ' ↕'}
      </span>
    </Link>
  );

  return (
    <ListTransition>
      <PageHeading
        title="Impact, beyond the scorecard."
        description="Ranked by Impact Score by default. Search, filter, or sort the roster to explore player performance."
      />
      <section className="section-panel bg-card border border-border rounded-lg overflow-hidden">
        <PlayerFilters
          query={query}
          pathname="/dashboard/leaderboard"
          total={result.meta.totalItems}
          teams={teams}
        />
        {players.length ? (
          <div className="table-scroll relative overflow-x-auto max-md:w-full">
            <table className="leaderboard-table table-fixed min-w-[940px] w-full border-collapse text-left text-xs">
              <caption className="sr-only">
                Players ranked by Cricket Impact Score, highest first
              </caption>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>{sortLabel('Team', 'team')}</th>
                  <th>Role</th>
                  <th className="numeric">{sortLabel('Matches', 'matches')}</th>
                  <th className="numeric">{sortLabel('Runs', 'runs')}</th>
                  <th className="numeric">{sortLabel('Wickets', 'wickets')}</th>
                  <th>Status</th>
                  <th>{sortLabel('Impact Score', 'impact')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id}>
                    <td>
                      <span
                        className={`rank${offset + index === 0 ? ' rank-first' : ''}`}
                      >
                        {String(offset + index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="player-name">{player.name}</td>
                    <td>{player.teamName}</td>
                    <td>
                      <span className="role-tag">{player.role}</span>
                    </td>
                    <td className="numeric">{player.matchesPlayed}</td>
                    <td className="numeric">
                      {numberFormat.format(player.totalRuns)}
                    </td>
                    <td className="numeric">{player.totalWickets}</td>
                    <td>
                      <span
                        className={`experience-tag experience-${player.experienceStatus.toLowerCase()}`}
                      >
                        {player.experienceStatus}
                      </span>
                    </td>
                    <td>
                      <ScoreBreakdown player={player} showTrigger={false} />
                    </td>
                    <td>
                      <ScoreBreakdown player={player} showScore={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              query.search || query.role || query.teamId
                ? 'No players match those filters.'
                : 'Your game changers will appear here.'
            }
            description="Add players to start your leaderboard. Scores update as career statistics change."
            href={
              query.search || query.role || query.teamId
                ? '/dashboard/leaderboard'
                : '/dashboard/players/new'
            }
            action={
              query.search || query.role || query.teamId
                ? 'Clear filters'
                : 'Add a player'
            }
          />
        )}
        <Pagination meta={result.meta} />
      </section>
      <details className="formula-panel mt-6 bg-[#e9eddf] rounded-[5px] p-[20px_24px] text-xs">
        <summary className="cursor-pointer font-bold text-foreground">
          How is Impact Score calculated?
        </summary>
        <p className="text-[#42573c] max-w-[75ch] mt-4 leading-normal">
          Runs × 1.2 + wickets × 20. Batsmen receive × 1.3 on their run
          contribution; Bowlers receive × 1.5 on their wicket contribution.
          Wicketkeepers receive a flat +30 with no role multiplier.
        </p>
        <p>
          Rookie: 0–4 matches and −50 points. Regular: 5–20 matches with no
          adjustment. Veteran: 21 or more matches and +100 points. Ties are
          ordered by player name, then ID.
        </p>
      </details>
    </ListTransition>
  );
}
