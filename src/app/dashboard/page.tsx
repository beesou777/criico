import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { authenticatedDashboard } from '@/lib/backend';
import { numberFormat } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';
import { TopPerformersTables } from '@/components/top-performers-tables';

export default async function DashboardPage() {
  const dashboard = await authenticatedDashboard();
  const {
    topRunScorers: batters,
    topWicketTakers: bowlers,
    recentMatches: matches,
  } = dashboard;

  return (
    <>
      <PageHeading
        title="Your clubhouse."
        description="Your teams, matches, and player performances."
        action={
          <Link
            href="/dashboard/matches/new"
            prefetch={false}
            className="button button-primary"
          >
            <Plus size={18} />
            Record a match
          </Link>
        }
      />
      <section className="summary-row" aria-label="Clubhouse overview">
        <div>
          <span>Players in your roster</span>
          <strong>{dashboard.totalPlayers.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/players" prefetch={false}>
            Manage squad <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Teams in your club</span>
          <strong>{dashboard.totalTeams.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/teams" prefetch={false}>
            View teams <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Matches recorded</span>
          <strong>{dashboard.totalMatches.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/matches" prefetch={false}>
            Open matchbook <ArrowUpRight size={15} />
          </Link>
        </div>
        <div>
          <span>Career runs across roster</span>
          <strong>{numberFormat.format(dashboard.totalRuns)}</strong>
          <Link href="/dashboard/leaderboard" prefetch={false}>
            Standings <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <div className="overview-grid">
        <section className="section-panel">
          <div className="section-heading">
            <h2>Top performances</h2>
            <Link href="/dashboard/leaderboard" prefetch={false}>
              Full leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
          <TopPerformersTables batters={batters} bowlers={bowlers} />
        </section>
        <section className="section-panel">
          <div className="section-heading">
            <h2>Recent matches</h2>
            <Link href="/dashboard/matches" prefetch={false}>
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
