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
            <h2>Leading impact</h2>
            <Link href="/dashboard/leaderboard">
              Full leaderboard <ArrowUpRight size={16} />
            </Link>
          </div>
          {leader ? (
            <div className="featured-player">
              <div className="featured-badges">
                <span className="rank-badge">#1 Impact Player</span>
                <span className="role-tag">{leader.role}</span>
                {leader.teamName ? (
                  <span className="team-pill">{leader.teamName}</span>
                ) : null}
              </div>
              <h3 className="featured-player-name">{leader.name}</h3>

              <div className="featured-score-hero">
                <div className="score-hero-info">
                  <span className="score-hero-label">Cricket Impact Score</span>
                  <span className="score-hero-hint">
                    Ranked #1 across your club
                  </span>
                </div>
                <strong className="score-hero-value">
                  {numberFormat.format(leader.score.total)}
                </strong>
              </div>

              <div className="leader-stats-grid">
                <div className="stat-tile">
                  <span className="stat-label">Matches</span>
                  <span className="stat-val">{leader.matchesPlayed}</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Runs</span>
                  <span className="stat-val">
                    {numberFormat.format(leader.totalRuns)}
                  </span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Wickets</span>
                  <span className="stat-val">{leader.totalWickets}</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Base Price</span>
                  <span className="stat-val">
                    NPR {numberFormat.format(leader.basePrice)}
                  </span>
                </div>
              </div>

              <ScoreBreakdown player={leader} showScore={false} />
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
