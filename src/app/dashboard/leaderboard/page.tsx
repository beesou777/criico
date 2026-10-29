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
import clsx from 'clsx';

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
      <span className="text-accent text-xs pb-[2px]" aria-hidden="true">
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
                Players ranked by Impact Score, highest first
              </caption>
              <thead>
                <tr>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap w-[7%]">
                    Rank
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap w-[17%]">
                    Player
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap w-[12%]">
                    Role
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap w-[17%]">
                    {sortLabel('Team', 'team')}
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums w-[9%]">
                    {sortLabel('Matches', 'matches')}
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums w-[9%]">
                    {sortLabel('Runs', 'runs')}
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums w-[9%]">
                    {sortLabel('Wickets', 'wickets')}
                  </th>
                  <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap w-[20%]">
                    {sortLabel('Impact Score', 'impact')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#f9faf4] transition-colors"
                  >
                    <td className="p-[18px] border-t border-[#e6e9df] align-top">
                      <span
                        className={clsx(
                          'rank tabular-nums text-[19px] font-bold',
                          offset + i === 0
                            ? 'rank-first text-[#7d5410]'
                            : 'text-secondary',
                        )}
                      >
                        {String(offset + i + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top font-bold whitespace-nowrap text-foreground">
                      {p.name}
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top">
                      <span className="role-tag inline-block bg-[#f9e8ed] text-[#9b1836] rounded-[3px] text-[10px] font-semibold p-[4px_8px] whitespace-nowrap">
                        {p.role}
                      </span>
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top text-foreground">
                      {p.teamName}
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-foreground">
                      {p.matchesPlayed}
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-foreground">
                      {numberFormat.format(p.totalRuns)}
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-foreground">
                      {p.totalWickets}
                    </td>
                    <td className="p-[18px] border-t border-[#e6e9df] align-top">
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
      <details className="formula-panel mt-6 bg-[#e9eddf] rounded-[5px] p-[20px_24px] text-xs">
        <summary className="cursor-pointer font-bold text-foreground">
          How is Impact Score calculated?
        </summary>
        <p className="text-[#42573c] max-w-[75ch] mt-4 leading-normal">
          Runs × 1.2 + wickets × 20. Batsmen receive × 1.3 on their run
          contribution; Bowlers receive × 1.5 on their wicket contribution.
          Wicketkeepers receive a flat +30 with no role multiplier.
        </p>
        <p className="text-[#42573c] max-w-[75ch] mt-4 leading-normal">
          Fewer than 5 matches: −50. More than 20 matches: +100. Exactly 5 or
          20: no adjustment. Negative scores are valid. Ties are ordered by
          player name, then ID.
        </p>
      </details>
    </ListTransition>
  );
}
