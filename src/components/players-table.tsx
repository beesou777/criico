'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Pencil } from 'lucide-react';
import { numberFormat, roles, type Player } from '@/lib/contracts';
export function PlayersTable({ players }: { players: Player[] }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All roles');
  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (role === 'All roles' || role === p.role),
  );
  return (
    <>
      <div className="table-toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search players</span>
          <input
            placeholder="Find a player…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="filter-field">
          <span className="sr-only">Filter by role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>All roles</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <span className="result-count" aria-live="polite">
          {filtered.length} players
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Your cricket players and career statistics
          </caption>
          <thead>
            <tr>
              <th>Player</th>
              <th>Role</th>
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
            {filtered.map((p) => (
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
        {!filtered.length && (
          <div className="table-empty">
            No players match those filters. Try a different name or role.
          </div>
        )}
      </div>
    </>
  );
}
