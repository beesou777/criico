import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import { rankedPlayerSchema, numberFormat } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { ScoreBreakdown } from '@/components/score-breakdown';
export const metadata = { title: 'Leaderboard' };
export default async function LeaderboardPage() {
  // Initial leaderboard data is deliberately fetched in this Server Component.
  const players = z
    .array(rankedPlayerSchema)
    .parse(await authenticatedData('/api/leaderboard'));
  return (
    <>
      <PageHeading
        title="Impact, beyond the scorecard."
        description="Career performances, role weighting, and experience. Every point explained."
      />
      <section className="section-panel">
        {players.length ? (
          <div className="table-scroll">
            <table className="leaderboard-table">
              <caption className="sr-only">
                Players ranked by Impact Score, highest first
              </caption>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Role</th>
                  <th className="numeric">Matches</th>
                  <th className="numeric">Runs</th>
                  <th className="numeric">Wickets</th>
                  <th>Impact Score</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`rank${i === 0 ? ' rank-first' : ''}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="player-name">{p.name}</td>
                    <td>
                      <span className="role-tag">{p.role}</span>
                    </td>
                    <td className="numeric">{p.matchesPlayed}</td>
                    <td className="numeric">
                      {numberFormat.format(p.totalRuns)}
                    </td>
                    <td className="numeric">{p.totalWickets}</td>
                    <td>
                      <ScoreBreakdown player={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Your game changers will appear here."
            description="Add players to start your leaderboard. Scores update as career statistics change."
            href="/dashboard/players/new"
            action="Add a player"
          />
        )}
      </section>
      <details className="formula-panel">
        <summary>How is Impact Score calculated?</summary>
        <p>
          Runs × 1.2 + wickets × 20. Batsmen receive × 1.3 on their run
          contribution; Bowlers receive × 1.5 on their wicket contribution.
          Wicketkeepers receive a flat +30 with no role multiplier.
        </p>
        <p>
          Fewer than 5 matches: −50. More than 20 matches: +100. Exactly 5 or
          20: no adjustment. Negative scores are valid. Ties are ordered by
          player name, then ID.
        </p>
      </details>
    </>
  );
}
