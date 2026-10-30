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
          Disbanding preserves the team&apos;s players and match history. You
          can restore a disbanded team later.
        </p>
        {teams.length ? (
          <div className="team-list grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-[14px] mt-5">
            {teams.map((team) => (
              <article
                className={`team-card grid grid-cols-[38px_1fr_auto] items-center gap-[3px_13px] min-h-[84px] p-[17px] border border-border rounded-lg bg-background text-foreground ${team.disbandedAt ? 'opacity-65' : 'transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[#c68a98] hover:bg-[#fffaf8] hover:-translate-y-px'}`}
                key={team.id}
              >
                <span className="team-mark row-span-2 grid place-items-center w-[38px] h-[38px] rounded-full bg-soft text-accent text-xs font-extrabold">
                  XI
                </span>
                <Link
                  className="truncate text-sm font-bold text-foreground"
                  href={`/dashboard/players?teamId=${encodeURIComponent(team.id)}`}
                  aria-label={`${team.name}, ${team.playerCount} ${team.playerCount === 1 ? 'player' : 'players'}. View players`}
                >
                  {team.name}
                </Link>
                <span className="team-caption text-secondary text-xs">
                  {team.playerCount}{' '}
                  {team.playerCount === 1 ? 'player' : 'players'}
                  {team.disbandedAt && (
                    <span className="ml-2 rounded bg-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary">
                      Disbanded
                    </span>
                  )}
                </span>
                <TeamActions
                  teamId={team.id}
                  teamName={team.name}
                  disbanded={Boolean(team.disbandedAt)}
                />
              </article>
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
