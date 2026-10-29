import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { matchResult, type CricketMatch } from '@/lib/contracts';

export function MatchList({ matches }: { matches: CricketMatch[] }) {
  return (
    <div className="match-list border-border">
      {matches.map((match) => {
        const badgeClasses =
          match.result === 'TIE'
            ? 'bg-[#fdf5ea] text-[#7d5410] border-[#f0dac2]'
            : match.result === 'NO_RESULT'
              ? 'bg-[#f2f2f2] text-secondary border-border'
              : 'bg-[#eef5ea] text-[#2b5420] border-[#d0e4c8]';

        return (
          <article
            key={match.id}
            className="group border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-[#faf7f2]"
          >
            <Link
              href={`/dashboard/matches/${match.id}`}
              className="match-item-link block p-[18px_24px] no-underline text-inherit focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
              aria-label={`${match.teamA} versus ${match.teamB}, ${matchResult(match)}`}
            >
              <div className="match-card-header flex items-center justify-between gap-3 mb-2">
                <span className="match-date text-[11px] text-secondary tabular-nums">
                  {new Intl.DateTimeFormat('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Asia/Kathmandu',
                  }).format(
                    new Date(`${match.playedAt.slice(0, 10)}T12:00:00Z`),
                  )}
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
              <h3 className="match-teams text-base font-bold tracking-tight text-foreground flex items-center gap-2 m-0">
                <span>{match.teamA}</span>
                <span className="vs-divider text-[11px] font-medium text-secondary uppercase">
                  vs
                </span>
                <span>{match.teamB}</span>
              </h3>
              <div className="match-footer flex items-center justify-end mt-2">
                <span className="match-link-text text-[11px] text-secondary inline-flex items-center gap-1 font-medium transition-colors duration-150 group-hover:text-accent">
                  View matchbook <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
