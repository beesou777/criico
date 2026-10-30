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
            className="button button-primary inline-flex justify-center items-center gap-[9px] min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-xs"
          >
            <Plus size={18} />
            Record a match
          </Link>
        }
      />
      <section
        className="summary-row grid grid-cols-4 border-t border-b border-[#99ab92] mb-8 py-6 max-lg:grid-cols-2 max-lg:gap-y-6 max-md:grid-cols-1 max-md:gap-y-4 max-md:py-4"
        aria-label="Clubhouse overview"
      >
        <div className="px-[22px] border-l border-border first:pl-0 first:border-l-0 max-lg:px-4 max-lg:[&:nth-child(2n+1)]:pl-0 max-lg:[&:nth-child(2n+1)]:border-l-0 max-md:p-[0_0_14px_0] max-md:border-l-0 max-md:border-b max-md:border-border">
          <span className="text-[11px] text-secondary block max-md:text-[10px] max-md:leading-[1.5]">
            Players in your roster
          </span>
          <strong className="block text-[38px] font-bold leading-[1.35] tracking-[-0.04em] tabular-nums m-[4px_0_6px_0] max-md:text-[28px] max-md:m-[4px_0]">
            {dashboard.totalPlayers.toString().padStart(2, '0')}
          </strong>
          <Link
            className="text-[11px] flex items-center gap-1 text-foreground no-underline font-medium hover:text-accent max-md:text-[10px] max-md:leading-[1.5]"
            href="/dashboard/players"
            prefetch={false}
          >
            Manage squad <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="px-[22px] border-l border-border first:pl-0 first:border-l-0 max-lg:px-4 max-lg:[&:nth-child(2n+1)]:pl-0 max-lg:[&:nth-child(2n+1)]:border-l-0 max-md:p-[0_0_14px_0] max-md:border-l-0 max-md:border-b max-md:border-border">
          <span className="text-[11px] text-secondary block max-md:text-[10px] max-md:leading-[1.5]">
            Teams in your club
          </span>
          <strong className="block text-[38px] font-bold leading-[1.35] tracking-[-0.04em] tabular-nums m-[4px_0_6px_0] max-md:text-[28px] max-md:m-[4px_0]">
            {dashboard.totalTeams.toString().padStart(2, '0')}
          </strong>
          <Link
            className="text-[11px] flex items-center gap-1 text-foreground no-underline font-medium hover:text-accent max-md:text-[10px] max-md:leading-[1.5]"
            href="/dashboard/teams"
            prefetch={false}
          >
            View teams <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="px-[22px] border-l border-border first:pl-0 first:border-l-0 max-lg:px-4 max-lg:[&:nth-child(2n+1)]:pl-0 max-lg:[&:nth-child(2n+1)]:border-l-0 max-md:p-[0_0_14px_0] max-md:border-l-0 max-md:border-b max-md:border-border">
          <span className="text-[11px] text-secondary block max-md:text-[10px] max-md:leading-[1.5]">
            Matches recorded
          </span>
          <strong className="block text-[38px] font-bold leading-[1.35] tracking-[-0.04em] tabular-nums m-[4px_0_6px_0] max-md:text-[28px] max-md:m-[4px_0]">
            {dashboard.totalMatches.toString().padStart(2, '0')}
          </strong>
          <Link
            className="text-[11px] flex items-center gap-1 text-foreground no-underline font-medium hover:text-accent max-md:text-[10px] max-md:leading-[1.5]"
            href="/dashboard/matches"
            prefetch={false}
          >
            Open matchbook <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="px-[22px] border-l border-border first:pl-0 first:border-l-0 max-lg:px-4 max-lg:[&:nth-child(2n+1)]:pl-0 max-lg:[&:nth-child(2n+1)]:border-l-0 max-md:p-0 max-md:border-l-0 max-md:border-b-0">
          <span className="text-[11px] text-secondary block max-md:text-[10px] max-md:leading-[1.5]">
            Career runs across roster
          </span>
          <strong className="block text-[38px] font-bold leading-[1.35] tracking-[-0.04em] tabular-nums m-[4px_0_6px_0] max-md:text-[28px] max-md:m-[4px_0]">
            {numberFormat.format(dashboard.totalRuns)}
          </strong>
          <Link
            className="text-[11px] flex items-center gap-1 text-foreground no-underline font-medium hover:text-accent max-md:text-[10px] max-md:leading-[1.5]"
            href="/dashboard/leaderboard"
            prefetch={false}
          >
            Standings <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <div className="overview-grid grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <section className="section-panel bg-card border border-border rounded-lg overflow-hidden">
          <div className="section-heading flex items-center justify-between gap-[15px] p-[20px_23px] border-b border-border max-md:p-[18px]">
            <h2 className="text-base font-bold tracking-tight text-foreground max-md:text-[15px]">
              Top performances
            </h2>
            <Link
              className="inline-flex gap-1 items-center text-[11px] font-medium text-foreground hover:text-accent max-md:text-[9px]"
              href="/dashboard/leaderboard"
              prefetch={false}
            >
              Full leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
          <TopPerformersTables batters={batters} bowlers={bowlers} />
        </section>
        <section className="section-panel bg-card border border-border rounded-lg overflow-hidden">
          <div className="section-heading flex items-center justify-between gap-[15px] p-[20px_23px] border-b border-border max-md:p-[18px]">
            <h2 className="text-base font-bold tracking-tight text-foreground max-md:text-[15px]">
              Recent matches
            </h2>
            <Link
              className="inline-flex gap-1 items-center text-[11px] font-medium text-foreground hover:text-accent max-md:text-[9px]"
              href="/dashboard/matches"
              prefetch={false}
            >
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {matches.length ? (
            <MatchList matches={matches.slice(0, 4)} />
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
