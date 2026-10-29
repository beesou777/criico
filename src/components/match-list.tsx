import { matchResult, type CricketMatch } from '@/lib/contracts';
export function MatchList({ matches }: { matches: CricketMatch[] }) {
  return (
    <div className="match-list">
      {matches.map((match) => (
        <article key={match.id}>
          <div className="match-date">
            {new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'Asia/Kathmandu',
            }).format(new Date(`${match.playedAt.slice(0, 10)}T12:00:00Z`))}
          </div>
          <h3>
            {match.teamA}
            <span>vs</span>
            {match.teamB}
          </h3>
          <p>{matchResult(match)}</p>
        </article>
      ))}
    </div>
  );
}
