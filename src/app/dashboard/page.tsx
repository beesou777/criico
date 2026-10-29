import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { authenticatedData, authenticatedSummary } from '@/lib/backend';
import {
  playerPageSchema,
  matchPageSchema,
  numberFormat,
} from '@/lib/contracts';
import { calculateImpactScore } from '@/lib/score';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';

export default async function DashboardPage() {
  const [topRunsPage, topWicketsPage, matchPage, summary] = await Promise.all([
    authenticatedData('/api/players?sort=runs&direction=desc&limit=1').then(
      (data) => playerPageSchema.parse(data),
    ),
    authenticatedData('/api/players?sort=wickets&direction=desc&limit=1').then(
      (data) => playerPageSchema.parse(data),
    ),
    authenticatedData('/api/matches?limit=3').then((data) =>
      matchPageSchema.parse(data),
    ),
    authenticatedSummary(),
  ]);

  const topScorer = topRunsPage.data[0];
  const topWicketTaker = topWicketsPage.data[0];
  const matches = matchPage.data;

  const topScorerScore = topScorer ? calculateImpactScore(topScorer) : null;
  const topWicketScore = topWicketTaker
    ? calculateImpactScore(topWicketTaker)
    : null;

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
          {topScorer || topWicketTaker ? (
            <div className="top-performers-list">
              {topScorer && (
                <article className="performer-row">
                  <div className="performer-header">
                    <div className="featured-badges">
                      <span className="discipline-badge discipline-batting">
                        Top Run Scorer
                      </span>
                      <span className="role-tag">{topScorer.role}</span>
                      {topScorer.teamName ? (
                        <span className="team-pill">{topScorer.teamName}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="performer-body">
                    <div className="performer-main">
                      <h3 className="performer-name">{topScorer.name}</h3>
                      <div className="performer-meta">
                        <span>{topScorer.matchesPlayed} matches</span>
                        <span className="meta-bullet">·</span>
                        <span>{topScorer.totalWickets} wickets</span>
                        {topScorerScore && (
                          <>
                            <span className="meta-bullet">·</span>
                            <span className="performer-impact">
                              Impact {numberFormat.format(topScorerScore.total)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="performer-stat-badge stat-batting">
                      <span className="stat-badge-num">
                        {numberFormat.format(topScorer.totalRuns)}
                      </span>
                      <span className="stat-badge-unit">runs</span>
                    </div>
                  </div>
                </article>
              )}

              {topWicketTaker && (
                <article className="performer-row">
                  <div className="performer-header">
                    <div className="featured-badges">
                      <span className="discipline-badge discipline-bowling">
                        Top Wicket Taker
                      </span>
                      <span className="role-tag">{topWicketTaker.role}</span>
                      {topWicketTaker.teamName ? (
                        <span className="team-pill">
                          {topWicketTaker.teamName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="performer-body">
                    <div className="performer-main">
                      <h3 className="performer-name">{topWicketTaker.name}</h3>
                      <div className="performer-meta">
                        <span>{topWicketTaker.matchesPlayed} matches</span>
                        <span className="meta-bullet">·</span>
                        <span>
                          {numberFormat.format(topWicketTaker.totalRuns)} runs
                        </span>
                        {topWicketScore && (
                          <>
                            <span className="meta-bullet">·</span>
                            <span className="performer-impact">
                              Impact {numberFormat.format(topWicketScore.total)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="performer-stat-badge stat-bowling">
                      <span className="stat-badge-num">
                        {topWicketTaker.totalWickets}
                      </span>
                      <span className="stat-badge-unit">wickets</span>
                    </div>
                  </div>
                </article>
              )}
            </div>
          ) : (
            <EmptyState
              title="Your first player starts the story."
              description="Add your squad to see top run scorers and wicket takers."
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
