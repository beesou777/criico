import type { RankedPlayer } from '@/lib/contracts';
import { numberFormat } from '@/lib/contracts';
export function ScoreBreakdown({ player }: { player: RankedPlayer }) {
  const s = player.score;
  return (
    <details className="score-details">
      <summary>
        <span className="score-value">{numberFormat.format(s.total)}</span>
        <span className="score-hint">View breakdown</span>
      </summary>
      <dl>
        <div>
          <dt>Runs{player.role === 'Batsman' ? ' × 1.3 role bonus' : ''}</dt>
          <dd>{numberFormat.format(s.runs)}</dd>
        </div>
        <div>
          <dt>Wickets{player.role === 'Bowler' ? ' × 1.5 role bonus' : ''}</dt>
          <dd>{numberFormat.format(s.wickets)}</dd>
        </div>
        <div>
          <dt>
            {player.matchesPlayed < 5
              ? 'Rookie adjustment'
              : player.matchesPlayed > 20
                ? 'Veteran bonus'
                : 'Experience adjustment'}
          </dt>
          <dd>{numberFormat.format(s.experience)}</dd>
        </div>
        {player.role === 'Wicketkeeper' && (
          <div>
            <dt>Wicketkeeper bonus</dt>
            <dd>{s.keeper}</dd>
          </div>
        )}
      </dl>
    </details>
  );
}
