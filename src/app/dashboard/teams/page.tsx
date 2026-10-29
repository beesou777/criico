import { authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { TeamForm } from '@/components/team-form';
export const metadata = { title: 'Teams' };
export default async function TeamsPage() {
  const teams = await authenticatedTeams();
  return (
    <>
      <PageHeading
        title="Your teams."
        description="Create the clubs you manage, then assign every player to the right side."
      />
      <section className="section-panel team-panel">
        <TeamForm />
        {teams.length ? (
          <div className="team-list">
            {teams.map((team) => (
              <article key={team.id}>
                <span className="team-mark">XI</span>
                <strong>{team.name}</strong>
                <span className="team-caption">Managed team</span>
              </article>
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
