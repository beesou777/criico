import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { numberFormat, type Player } from '@/lib/contracts';
export function PlayersTable({ players }: { players: Player[] }) {
  return (
    <>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Your cricket players and career statistics
          </caption>
          <thead>
            <tr>
              <th>Player</th>
              <th>Role</th>
              <th>Team</th>
              <th className="numeric">Matches</th>
              <th className="numeric">Runs</th>
              <th className="numeric">Wickets</th>
              <th className="numeric">Base price (NPR)</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td className="player-name">
                  <span className="avatar">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <Link href={`/dashboard/players/${p.id}`}>{p.name}</Link>
                </td>
                <td>
                  <span className="role-tag">{p.role}</span>
                </td>
                <td>
                  {p.teamName ?? <span className="muted">Unassigned</span>}
                </td>
                <td className="numeric">{p.matchesPlayed}</td>
                <td className="numeric">{numberFormat.format(p.totalRuns)}</td>
                <td className="numeric">{p.totalWickets}</td>
                <td className="numeric">{numberFormat.format(p.basePrice)}</td>
                <td>
                  <Link
                    className="icon-button"
                    href={`/dashboard/players/${p.id}`}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil size={17} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!players.length && (
          <div className="table-empty">
            No players match those filters. Try a different name or role.
          </div>
        )}
      </div>
    </>
  );
}
