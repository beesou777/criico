import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { matchResult, type CricketMatch } from '@/lib/contracts';

export function MatchList({ matches }: { matches: CricketMatch[] }) {
  return (
    <div className="match-list">
      {matches.map((match) => (
        <article key={match.id} className="match-item">
          <Link
            href="/dashboard/matches"
            className="match-item-link"
            aria-label={`${match.teamA} versus ${match.teamB}, ${matchResult(match)}`}
          >
            <div className="match-card-header">
              <span className="match-date">
                {new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Asia/Kathmandu',
                }).format(new Date(`${match.playedAt.slice(0, 10)}T12:00:00Z`))}
              </span>
              <span
                className="match-outcome-badge"
                data-outcome={match.result}
              >
                {matchResult(match)}
              </span>
            </div>
            <h3 className="match-teams">
              <span className="team-name">{match.teamA}</span>
              <span className="vs-divider">vs</span>
              <span className="team-name">{match.teamB}</span>
            </h3>
            <div className="match-footer">
              <span className="match-link-text">
                View matchbook <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
