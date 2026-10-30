import { PageHeading } from '@/components/page-heading';
import { PlayerForm } from '@/components/player-form';
import { authenticatedTeams } from '@/lib/backend';
import { EmptyState } from '@/components/empty-state';
export const metadata = { title: 'Add player' };
export default async function NewPlayerPage() {
  const teams = await authenticatedTeams();
  return (
    <>
      <PageHeading
        title="A new name on the sheet."
        description="Add a player and give their performances a place to count."
      />
      {teams.length ? (
        <PlayerForm teams={teams} />
      ) : (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <EmptyState
            title="Create a team first."
            description="Every player must belong to a team before they can appear in matchbook or leaderboard views."
            href="/dashboard/teams"
            action="Create a team"
          />
        </section>
      )}
    </>
  );
}
