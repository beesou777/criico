import { authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { TeamForm } from '@/components/team-form';
import Link from 'next/link';
export const metadata = { title: 'Teams' };
export default async function TeamsPage() {
  const teams = await authenticatedTeams();
  return (
    <>
      <div className="teams-heading">
        <PageHeading
          title="Your teams."
          description="Create the clubs you manage, then assign every player to the right side."
        />
        <p className="teams-count" aria-live="polite">
          {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        </p>
      </div>
      <section className="section-panel team-panel">
        <TeamForm />
        {teams.length ? (
          <div className="team-list">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/players?teamId=${encodeURIComponent(team.id)}`}
                aria-label={`${team.name}, ${team.playerCount} ${team.playerCount === 1 ? 'player' : 'players'}. View players`}
              >
                <span className="team-mark">XI</span>
                <strong>{team.name}</strong>
                <span className="team-caption">
                  {team.playerCount}{' '}
                  {team.playerCount === 1 ? 'player' : 'players'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="form-description">
            No teams yet. Create your first team before adding players.
          </p>
        )}
      </section>
    </>
  );
}
