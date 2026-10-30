import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { numberFormat, type Player } from '@/lib/contracts';

export function PlayersTable({ players }: { players: Player[] }) {
  return (
    <div className="table-scroll relative overflow-x-auto max-md:w-full">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">
          Your cricket players and career statistics
        </caption>
        <thead>
          <tr>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap">
              Player
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap">
              Role
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap">
              Team
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums">
              Matches
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums">
              Runs
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums">
              Wickets
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap text-right tabular-nums">
              Base price (NPR)
            </th>
            <th className="p-[15px_18px] bg-[#f0f2e9] text-secondary text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="hover:bg-[#f9faf4] transition-colors">
              <td className="p-[18px] border-t border-[#e6e9df] align-top font-bold whitespace-nowrap">
                <span className="avatar inline-flex items-center justify-center bg-[#e2e8dc] text-[#1a4f32] font-extrabold w-7 h-7 rounded-full mr-3 text-[11px]">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <Link
                  className="hover:text-accent transition-colors text-ink"
                  href={`/dashboard/players/${p.id}`}
                >
                  {p.name}
                </Link>
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top">
                <span className="role-tag inline-block bg-[#f9e8ed] text-[#9b1836] rounded-[3px] text-[10px] font-semibold p-[4px_8px] whitespace-nowrap">
                  {p.role}
                </span>
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top text-ink">
                {p.teamName ?? (
                  <span className="text-secondary">Unassigned</span>
                )}
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-ink">
                {p.matchesPlayed}
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-ink">
                {numberFormat.format(p.totalRuns)}
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-ink">
                {p.totalWickets}
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top text-right tabular-nums text-ink">
                {numberFormat.format(p.basePrice)}
              </td>
              <td className="p-[18px] border-t border-[#e6e9df] align-top">
                <Link
                  className="icon-button inline-flex items-center justify-center bg-transparent border-0 text-primary w-10 h-10 rounded-[4px] hover:bg-soft transition-colors"
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
        <div className="table-empty p-[45px_20px] text-center text-xs text-secondary">
          No players match those filters. Try a different name or role.
        </div>
      )}
    </div>
  );
}
