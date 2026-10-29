import type { RankedPlayer } from '@/lib/contracts';
import { numberFormat } from '@/lib/contracts';

export function ScoreBreakdown({
  player,
  showScore = true,
}: {
  player: RankedPlayer;
  showScore?: boolean;
}) {
  const s = player.score;
  return (
    <details className="score-details min-w-[130px]">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        {showScore && (
          <span className="score-value font-extrabold text-[21px] text-primary tracking-[-0.025em] tabular-nums block">
            {numberFormat.format(s.total)}
          </span>
        )}
        <span className="score-hint block text-[9px] font-medium text-secondary underline hover:text-foreground">
          View score breakdown
        </span>
      </summary>
      <dl className="text-[10px] min-w-[180px] mt-3 text-secondary">
        <div className="flex justify-between gap-[14px] my-[7px]">
          <dt>Runs{player.role === 'Batsman' ? ' × 1.3 role bonus' : ''}</dt>
          <dd className="font-bold m-0 tabular-nums text-foreground">
            {numberFormat.format(s.runs)}
          </dd>
        </div>
        <div className="flex justify-between gap-[14px] my-[7px]">
          <dt>Wickets{player.role === 'Bowler' ? ' × 1.5 role bonus' : ''}</dt>
          <dd className="font-bold m-0 tabular-nums text-foreground">
            {numberFormat.format(s.wickets)}
          </dd>
        </div>
        <div className="flex justify-between gap-[14px] my-[7px]">
          <dt>
            {player.matchesPlayed < 5
              ? 'Rookie adjustment'
              : player.matchesPlayed > 20
                ? 'Veteran bonus'
                : 'Experience adjustment'}
          </dt>
          <dd className="font-bold m-0 tabular-nums text-foreground">
            {numberFormat.format(s.experience)}
          </dd>
        </div>
        {player.role === 'Wicketkeeper' && (
          <div className="flex justify-between gap-[14px] my-[7px]">
            <dt>Wicketkeeper bonus</dt>
            <dd className="font-bold m-0 tabular-nums text-foreground">{s.keeper}</dd>
          </div>
        )}
      </dl>
    </details>
  );
}
