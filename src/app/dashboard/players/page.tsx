import Link from 'next/link';
import { Plus } from 'lucide-react';
import { authenticatedPlayers, authenticatedTeams } from '@/lib/backend';
import { playerPageSchema } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { PlayersTable } from '@/components/players-table';
import { ListTransition } from '@/components/list-transition';
import { Pagination } from '@/components/pagination';
import { PlayerFilters } from '@/components/player-filters';
import { playerPageQuery, normalizePage } from '@/lib/list-page';
import type { SearchParams } from '@/lib/pagination';
export const metadata = { title: 'Players' };
export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = playerPageQuery(await searchParams, '/dashboard/players');
  const [playerData, teams] = await Promise.all([
    authenticatedPlayers(query),
    authenticatedTeams(),
  ]);
  const result = playerPageSchema.parse(playerData);
  normalizePage('/dashboard/players', query, result.meta.page);
  return (
    <ListTransition>
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
        <PlayerFilters
          query={query}
          pathname="/dashboard/players"
          total={result.meta.totalItems}
          teams={teams}
        />
        {result.meta.totalItems ? (
          <PlayersTable players={result.data} />
        ) : (
          <EmptyState
            title={
              query.search || query.role
                ? 'No players match those filters.'
                : 'Who?s first on the team sheet?'
            }
            description={
              query.search || query.role
                ? 'Clear the filters or try a different name or role.'
                : 'Add your first player, including any existing career statistics.'
            }
            href={
              query.search || query.role
                ? '/dashboard/players'
                : '/dashboard/players/new'
            }
            action={
              query.search || query.role
                ? 'Clear filters'
                : 'Add your first player'
            }
          />
        )}
        <Pagination meta={result.meta} />
      </section>
    </ListTransition>
  );
}
