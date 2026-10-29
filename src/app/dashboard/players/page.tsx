import Link from 'next/link';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import { playerSchema } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { PlayersTable } from '@/components/players-table';
export const metadata = { title: 'Players' };
export default async function PlayersPage() {
  const players = z
    .array(playerSchema)
    .parse(await authenticatedData('/api/players'));
  return (
    <>
      <PageHeading
        title="The squad."
        description="Every role has its place. Keep your players and career records together."
        action={
          <Link href="/dashboard/players/new" className="button button-primary">
            <Plus size={18} />
            Add a player
          </Link>
        }
      />
      <section className="section-panel">
        {players.length ? (
          <PlayersTable players={players} />
        ) : (
          <EmptyState
            title="Who’s first on the team sheet?"
            description="Add your first player, including any existing career statistics."
            href="/dashboard/players/new"
            action="Add your first player"
          />
        )}
      </section>
    </>
  );
}
