import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { authenticatedMatch } from '@/lib/backend';
import { matchResult, numberFormat } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';

export const metadata = { title: 'Match details' };

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const match = await authenticatedMatch(id);
  if (!match) notFound();

  const sides = [
    { side: 'A', name: match.teamA, performances: match.teamAPerformances },
    { side: 'B', name: match.teamB, performances: match.teamBPerformances },
  ] as const;
  const participantCount =
    match.teamAPerformances.length + match.teamBPerformances.length;

  return (
    <>
      <PageHeading
        title="Match details."
        description={`${match.teamA} versus ${match.teamB} · ${formatMatchDate(match.playedAt)}`}
        action={
          <Link className="button button-outline" href="/dashboard/matches">
            <ArrowLeft size={17} />
            Back to matchbook
          </Link>
        }
      />
      <section
        className="section-panel match-detail-summary"
        aria-label="Match information"
      >
        <div className="match-detail-meta">
          <span className="match-date">{formatMatchDate(match.playedAt)}</span>
          <span className="match-outcome-badge" data-outcome={match.result}>
            {matchResult(match)}
          </span>
        </div>
        <div className="match-detail-sides">
          {sides.map(({ side, name }) => (
            <div className="match-detail-team" key={side}>
              <span>{side === 'A' ? 'Team A' : 'Team B'}</span>
              <h2>{name}</h2>
              {match.result === side && (
                <strong className="match-winner-label">Winner</strong>
              )}
            </div>
          ))}
        </div>
        <p className="match-result-line">
          Official result <strong>{matchResult(match)}</strong>
        </p>
      </section>

      <section
        className="match-detail-performances"
        aria-labelledby="performances-heading"
      >
        <div className="match-detail-section-heading">
          <div>
            <h2 id="performances-heading">Player performances</h2>
            <p>Individual figures recorded for this match.</p>
          </div>
          <span>
            {participantCount}{' '}
            {participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>
        {participantCount === 0 ? (
          <p className="match-no-performances" role="status">
            No individual player performances were recorded for this match.
          </p>
        ) : (
          <div className="match-performance-grid">
            {sides.map(({ side, name, performances }) => (
              <section
                className="section-panel match-performance-team"
                key={side}
              >
                <div className="match-performance-team-heading">
                  <span
                    className={`side-badge ${side === 'A' ? 'team-a' : 'team-b'}`}
                  >
                    Team {side}
                  </span>
                  <h3>{name}</h3>
                  <span className="match-performance-count">
                    {performances.length} players
                  </span>
                </div>
                {performances.length ? (
                  <div className="match-performance-list">
                    {performances.map((performance) => (
                      <article
                        className="match-performance-row"
                        key={performance.playerId}
                      >
                        <div className="match-performance-player">
                          <strong>{performance.playerName}</strong>
                          <span>{performance.role}</span>
                        </div>
                        <dl>
                          <div>
                            <dt>Runs</dt>
                            <dd>{numberFormat.format(performance.runs)}</dd>
                          </div>
                          <div>
                            <dt>Wickets</dt>
                            <dd>{numberFormat.format(performance.wickets)}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="match-side-empty">
                    No individual performances recorded for this team.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
