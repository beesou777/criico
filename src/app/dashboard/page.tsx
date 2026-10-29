import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import {
  rankedPlayerSchema,
  cricketMatchSchema,
  numberFormat,
} from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';
import { ScoreBreakdown } from '@/components/score-breakdown';
export default async function DashboardPage() {
  const [players, matches] = await Promise.all([
    authenticatedData('/api/leaderboard').then((data) =>
      z.array(rankedPlayerSchema).parse(data),
    ),
    authenticatedData('/api/matches').then((data) =>
      z.array(cricketMatchSchema).parse(data),
    ),
  ]);
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
          <strong>{players.length.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/players">
            Manage squad <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>Matches recorded here</span>
          <strong>{matches.length.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/matches">
            Open matchbook <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <span>Career runs across roster</span>
          <strong>
            {numberFormat.format(
              players.reduce((sum, p) => sum + p.totalRuns, 0),
            )}
          </strong>
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
