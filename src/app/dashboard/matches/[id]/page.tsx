import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
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

  const badgeClasses =
    match.result === 'TIE'
      ? 'bg-[#fdf5ea] text-[#7d5410] border-[#f0dac2]'
      : match.result === 'NO_RESULT'
        ? 'bg-[#f2f2f2] text-secondary border-border'
        : 'bg-[#eef5ea] text-[#2b5420] border-[#d0e4c8]';

  return (
    <>
      <PageHeading
        title="Match details."
        description={`${match.teamA} versus ${match.teamB} · ${formatMatchDate(match.playedAt)}`}
        action={
          <Link
            className="button button-outline inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] bg-transparent hover:bg-soft transition-colors text-xs whitespace-nowrap"
            href="/dashboard/matches"
          >
            <ArrowLeft size={17} />
            Back to matchbook
          </Link>
        }
      />
      <section
        className="match-detail-summary section-panel bg-card border border-border rounded-lg overflow-hidden p-[24px_28px] max-md:p-[18px_16px]"
        aria-label="Match information"
      >
        <div className="match-detail-meta flex items-center justify-between gap-4">
          <span className="text-[11px] text-secondary tabular-nums">
            {formatMatchDate(match.playedAt)}
          </span>
          <span
            className={clsx(
              'match-outcome-badge inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border',
              badgeClasses,
            )}
            data-outcome={match.result}
          >
            {matchResult(match)}
          </span>
        </div>
        <div className="match-detail-sides grid grid-cols-2 gap-6 mt-6 max-md:grid-cols-1 max-md:gap-3 max-md:mt-[18px]">
          {sides.map(({ side, name }) => (
            <div
              className="match-detail-team min-w-0 p-[18px_20px] bg-background rounded-[6px] max-md:p-4"
              key={side}
            >
              <span className="block text-secondary text-[10px] font-bold tracking-[0.08em] uppercase">
                {side === 'A' ? 'Team A' : 'Team B'}
              </span>
              <h2 className="mt-[5px] break-words text-[clamp(17px,2vw,23px)] leading-[1.3] font-extrabold text-foreground">
                {name}
              </h2>
              {match.result === side && (
                <strong className="match-winner-label inline-block mt-2.5 text-[#47633c] text-[10px] font-bold">
                  Winner
                </strong>
              )}
            </div>
          ))}
        </div>
        <p className="match-result-line mt-[18px] text-secondary text-[11px]">
          Official result{' '}
          <strong className="ml-[5px] text-foreground font-bold">
            {matchResult(match)}
          </strong>
        </p>
      </section>

      <section
        className="match-detail-performances mt-[30px] max-md:mt-6"
        aria-labelledby="performances-heading"
      >
        <div className="match-detail-section-heading flex items-end justify-between gap-[18px] mb-[14px] max-md:items-start max-md:flex-col max-md:gap-1">
          <div>
            <h2
              className="text-[19px] font-bold tracking-[-0.025em] text-foreground"
              id="performances-heading"
            >
              Player performances
            </h2>
            <p className="text-secondary text-[11px] mt-1">
              Individual figures recorded for this match.
            </p>
          </div>
          <span className="text-secondary text-[11px]">
            {participantCount}{' '}
            {participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>
        {participantCount === 0 ? (
          <p
            className="p-[22px_24px] border border-border rounded-[6px] bg-card text-secondary text-xs"
            role="status"
          >
            No individual player performances were recorded for this match.
          </p>
        ) : (
          <div className="match-performance-grid grid grid-cols-2 items-start gap-[18px] max-md:grid-cols-1 max-md:gap-3">
            {sides.map(({ side, name, performances }) => (
              <section
                className="match-performance-team section-panel bg-card border border-border rounded-lg overflow-hidden min-w-0"
                key={side}
              >
                <div className="match-performance-team-heading flex items-center flex-wrap gap-[8px_10px] p-[17px_19px] border-b border-border max-md:p-[15px]">
                  <span
                    className={clsx(
                      'side-badge inline-flex items-center px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-[0.05em]',
                      side === 'A'
                        ? 'bg-[#e5ede7] text-[#123d2b] border-[#c2d6c6]'
                        : 'bg-[#fae8eb] text-[#dc143c] border-[#f1c3cb]',
                    )}
                  >
                    Team {side}
                  </span>
                  <h3 className="flex-1 min-w-[120px] break-words text-sm font-bold text-foreground m-0">
                    {name}
                  </h3>
                  <span className="match-performance-count text-secondary text-xs whitespace-nowrap">
                    {performances.length} players
                  </span>
                </div>
                {performances.length ? (
                  <div className="match-performance-list">
                    {performances.map((performance) => (
                      <article
                        className="match-performance-row grid grid-cols-2 items-center gap-[18px] p-[14px_19px] border-b border-border last:border-b-0 max-md:gap-2.5 max-md:p-[13px_15px]"
                        key={performance.playerId}
                      >
                        <div className="min-w-0">
                          <strong className="block break-words text-xs font-bold text-foreground">
                            {performance.playerName}
                          </strong>
                          <span className="block mt-[3px] text-secondary text-xs">
                            {performance.role}
                          </span>
                        </div>
                        <dl className="flex justify-end gap-4 m-0 max-md:gap-2.5">
                          <div className="min-w-[42px] text-right">
                            <dt className="text-secondary text-xs">Runs</dt>
                            <dd className="mt-0.5 m-0 text-sm font-bold tabular-nums text-foreground">
                              {numberFormat.format(performance.runs)}
                            </dd>
                          </div>
                          <div className="min-w-[42px] text-right">
                            <dt className="text-secondary text-xs">Wickets</dt>
                            <dd className="mt-0.5 m-0 text-sm font-bold tabular-nums text-foreground">
                              {numberFormat.format(performance.wickets)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="p-[18px_19px] text-secondary text-xs">
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
