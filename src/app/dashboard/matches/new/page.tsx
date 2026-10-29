import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import { playerSchema } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchForm } from '@/components/match-form';
export const metadata = { title: 'Record match' };
export default async function NewMatchPage() {
  const players = z
    .array(playerSchema)
    .parse(await authenticatedData('/api/players'));
  return (
    <>
      <PageHeading
        title="Put it in the matchbook."
        description="Record the result. Give every performance its place."
      />
      {players.length ? (
        <MatchForm players={players} />
      ) : (
        <section className="section-panel">
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
