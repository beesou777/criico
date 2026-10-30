import { authenticatedPlayerOptions, authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchForm } from '@/components/match-form';

export const metadata = { title: 'Record match' };

export default async function NewMatchPage() {
  const [players, teams] = await Promise.all([
    authenticatedPlayerOptions(),
    authenticatedTeams(),
  ]);

  return (
    <>
      <PageHeading
        title="Put it in the matchbook."
        description="Record the result. Give every performance its place."
      />
      {teams.length < 2 ? (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <EmptyState
            title="You need at least two teams."
            description="Create at least two teams before recording a match fixture."
            href="/dashboard/teams"
            action="Manage teams"
          />
        </section>
      ) : players.length ? (
        <MatchForm players={players} teams={teams} />
      ) : (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <EmptyState
            title="You need a squad first."
            description="Add at least one player before recording a match."
            href="/dashboard/players/new"
            action="Add a player"
          />
        </section>
      )}
    </>
  );
}
