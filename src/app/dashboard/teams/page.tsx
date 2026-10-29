import { authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { TeamForm } from '@/components/team-form';
import Link from 'next/link';

export const metadata = { title: 'Teams' };

export default async function TeamsPage() {
  const teams = await authenticatedTeams();

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
          {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        </p>
      </div>
      <section className="team-panel section-panel bg-card border border-border rounded-lg overflow-hidden p-[20px_22px_22px] max-sm:p-4">
        <TeamForm />
        {teams.length ? (
          <div className="team-list grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-[14px] mt-5">
            {teams.map((team) => (
              <Link
                className="grid grid-cols-[38px_1fr] items-center gap-[3px_13px] min-h-[84px] p-[17px] border border-border rounded-lg bg-background text-foreground no-underline transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[#c68a98] hover:bg-[#fffaf8] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                key={team.id}
                href={`/dashboard/players?teamId=${encodeURIComponent(team.id)}`}
                aria-label={`${team.name}, ${team.playerCount} ${team.playerCount === 1 ? 'player' : 'players'}. View players`}
              >
                <span className="team-mark row-span-2 grid place-items-center w-[38px] h-[38px] rounded-full bg-soft text-accent text-xs font-extrabold">
                  XI
                </span>
                <strong className="text-sm font-bold text-foreground truncate">{team.name}</strong>
                <span className="team-caption text-secondary text-xs">
                  {team.playerCount}{' '}
                  {team.playerCount === 1 ? 'player' : 'players'}
                </span>
              </Link>
            ))}
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
