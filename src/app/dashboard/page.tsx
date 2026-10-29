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
import { ScoreBreakdown } from '@/components/score-breakdown';
export default async function DashboardPage() {
  const [playerPage, matchPage, summary] = await Promise.all([
    authenticatedData('/api/leaderboard?limit=1').then((data) =>
      leaderboardPageSchema.parse(data),
    ),
    authenticatedData('/api/matches?limit=3').then((data) =>
      matchPageSchema.parse(data),
    ),
    authenticatedSummary(),
  ]);
  const players = playerPage.data;
  const matches = matchPage.data;
  const leader = players[0];
  return (
    <>
      <PageHeading
        title="Your clubhouse."
        description="The squad, the matchbook, and the performances that matter."
        action={
          <Link href="/dashboard/matches/new" className="button button-primary">
            <Plus size={18} />
            Record a match
          </Link>
        }
      />
      <section className="summary-row" aria-label="Squad overview">
        <div>
          <span>Players in your roster</span>
          <strong>{summary.totalPlayers.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/players">
            Manage squad <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>Matches recorded here</span>
          <strong>{summary.totalMatches.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/matches">
            Open matchbook <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>Career runs across roster</span>
          <strong>{numberFormat.format(summary.totalRuns)}</strong>
          <small>Includes imported career statistics</small>
        </div>
      </section>
      <div className="overview-grid">
        <section className="section-panel">
          <div className="section-heading">
            <h2>Leading impact</h2>
            <Link href="/dashboard/leaderboard">
              Full leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
          {leader ? (
            <div className="featured-player">
              <span className="role-tag">{leader.role}</span>
              <h3>{leader.name}</h3>
              <p>
                {leader.matchesPlayed} matches ·{' '}
                {numberFormat.format(leader.totalRuns)} runs ·{' '}
                {leader.totalWickets} wickets
              </p>
              <ScoreBreakdown player={leader} />
            </div>
          ) : (
            <EmptyState
              title="Your first player starts the story."
              description="Add your squad to see who makes the biggest impact."
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
