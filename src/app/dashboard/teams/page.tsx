import { authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { TeamForm } from '@/components/team-form';
import { TeamTable } from '@/components/team-table';

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
      <section className="team-panel section-panel bg-card border border-border rounded-lg overflow-visible p-[20px_22px_22px] max-sm:p-4">
        <TeamForm />
        <p className="mt-4 text-xs leading-relaxed text-secondary">
          Disbanding is reversible and preserves players and match history. The
          team remains available in this table so it can be restored later.
        </p>
        {teams.length ? (
          <TeamTable teams={teams} />
        ) : (
          <p className="form-description text-secondary text-xs leading-[1.8] pt-5 max-w-[75ch]">
            No teams yet. Create your first team before adding players.
          </p>
        )}
      </section>
    </div>
  );
}
