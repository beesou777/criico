import { authenticatedData, authenticatedTeams } from '@/lib/backend';
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
  // Initial leaderboard data is deliberately fetched in this Server Component.
  const query = playerPageQuery(await searchParams, '/dashboard/leaderboard');
  const result = leaderboardPageSchema.parse(
    await authenticatedData('/api/leaderboard?' + listQueryString(query)),
  );
  const teams = await authenticatedTeams();
  const players = result.data;
  normalizePage('/dashboard/leaderboard', query, result.meta.page);
  const offset = (result.meta.page - 1) * result.meta.limit;
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
    <Link className="table-sort" href={sortHref(field)}>
      {label}
      <span aria-hidden="true">
        {query.sort === field
          ? query.direction === 'asc'
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
        description="Career performances, role weighting, and experience. Every point explained."
      />
      <section className="section-panel">
        <PlayerFilters
          query={query}
          pathname="/dashboard/leaderboard"
          total={result.meta.totalItems}
          teams={teams}
        />
        {players.length ? (
          <div className="table-scroll">
            <table className="leaderboard-table">
              <caption className="sr-only">
                Players ranked by Impact Score, highest first
              </caption>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Role</th>
                  <th>{sortLabel('Team', 'team')}</th>
                  <th className="numeric">{sortLabel('Matches', 'matches')}</th>
                  <th className="numeric">{sortLabel('Runs', 'runs')}</th>
                  <th className="numeric">{sortLabel('Wickets', 'wickets')}</th>
                  <th>{sortLabel('Impact Score', 'impact')}</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span
                        className={`rank${offset + i === 0 ? ' rank-first' : ''}`}
                      >
                        {String(offset + i + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="player-name">{p.name}</td>
                    <td>
                      <span className="role-tag">{p.role}</span>
                    </td>
                    <td>{p.teamName}</td>
                    <td className="numeric">{p.matchesPlayed}</td>
                    <td className="numeric">
                      {numberFormat.format(p.totalRuns)}
                    </td>
                    <td className="numeric">{p.totalWickets}</td>
                    <td>
                      <ScoreBreakdown player={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              query.search || query.role
                ? 'No players match those filters.'
                : 'Your game changers will appear here.'
            }
            description="Add players to start your leaderboard. Scores update as career statistics change."
            href={
              query.search || query.role
                ? '/dashboard/leaderboard'
                : '/dashboard/players/new'
            }
            action={
              query.search || query.role ? 'Clear filters' : 'Add a player'
            }
          />
        )}
        <Pagination meta={result.meta} />
      </section>
      <details className="formula-panel">
        <summary>How is Impact Score calculated?</summary>
        <p>
          Runs × 1.2 + wickets × 20. Batsmen receive × 1.3 on their run
          contribution; Bowlers receive × 1.5 on their wicket contribution.
          Wicketkeepers receive a flat +30 with no role multiplier.
        </p>
        <p>
          Fewer than 5 matches: −50. More than 20 matches: +100. Exactly 5 or
          20: no adjustment. Negative scores are valid. Ties are ordered by
          player name, then ID.
        </p>
      </details>
    </ListTransition>
  );
}
