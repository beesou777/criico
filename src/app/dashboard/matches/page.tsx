import Link from 'next/link';
import { Plus } from 'lucide-react';
import { authenticatedMatches } from '@/lib/backend';
import { matchPageSchema } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';
import { ListTransition } from '@/components/list-transition';
import { Pagination } from '@/components/pagination';
import { matchPageQuery, normalizePage } from '@/lib/list-page';
import type { SearchParams } from '@/lib/pagination';
export const metadata = { title: 'Matchbook' };
export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = matchPageQuery(await searchParams);
  const result = matchPageSchema.parse(await authenticatedMatches(query));
  normalizePage('/dashboard/matches', query, result.meta.page);
  return (
    <ListTransition>
      <PageHeading
        title="The matchbook."
        description="A record of the games your community played."
        action={
          <Link className="button button-primary" href="/dashboard/matches/new">
            <Plus size={18} />
            Record a match
          </Link>
        }
      />
      <section className="section-panel">
        {result.data.length ? (
          <MatchList matches={result.data} />
        ) : (
          <EmptyState
            title="Every match deserves a record."
            description="Add a completed match and the performances of players in your roster."
            href="/dashboard/matches/new"
            action="Record your first match"
          />
        )}
        <Pagination meta={result.meta} />
      </section>
    </ListTransition>
  );
}
