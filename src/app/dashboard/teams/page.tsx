import { authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { TeamForm } from '@/components/team-form';
import Link from 'next/link';
import { TeamActions } from '@/components/team-actions';

export const metadata = { title: 'Teams' };

export default async function TeamsPage() {
  const teams = await authenticatedTeams({ includeDisbanded: true });
  const activeTeams = teams.filter((team) => !team.disbandedAt);

  return (
    <div className="teams-heading">
      <div className="mb-[9px]">
        <PageHeading
          title="Your teams."
          description="Create the clubs you manage, then assign every player to the right side."
        />
        <p
          className="teams-count inline-flex items-center w-fit m-[0_0_22px] p-[4px_9px] rounded-[3px] bg-[#f1e8e5] text-secondary text-[10px] font-semibold tabular-nums"
          aria-live="polite"
        >
          {activeTeams.length} active{' '}
          {activeTeams.length === 1 ? 'team' : 'teams'}
        </p>
      </div>
      <section className="team-panel section-panel bg-card border border-border rounded-lg overflow-hidden p-[20px_22px_22px] max-sm:p-4">
        <TeamForm />
        <p className="mt-4 text-xs leading-relaxed text-secondary">
          Disbanding is reversible and preserves players and match history. The
          team remains available in this table so it can be restored later.
        </p>
        {teams.length ? (
          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead className="bg-soft text-[10px] uppercase tracking-[0.08em] text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-4 py-3 font-semibold">Players</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teams.map((team) => (
                  <tr
                    className={team.disbandedAt ? 'bg-soft/40' : 'bg-card'}
                    key={team.id}
                  >
                    <td className="px-4 py-3">
                      <Link
                        className="font-bold text-foreground hover:text-accent"
                        href={`/dashboard/players?teamId=${encodeURIComponent(team.id)}`}
                      >
                        {team.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {team.playerCount}{' '}
                      {team.playerCount === 1 ? 'player' : 'players'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-soft px-2 py-1 text-[10px] font-semibold text-secondary">
                        {team.disbandedAt ? 'Disbanded' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TeamActions
                        teamId={team.id}
                        teamName={team.name}
                        playerCount={team.playerCount}
                        disbanded={Boolean(team.disbandedAt)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="form-description text-secondary text-xs leading-[1.8] pt-5 max-w-[75ch]">
            No teams yet. Create your first team before adding players.
          </p>
        )}
      </section>
    </div>
  );
}
