import Link from 'next/link';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import { cricketMatchSchema } from '@/lib/contracts';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { MatchList } from '@/components/match-list';
export const metadata = { title: 'Matchbook' };
export default async function MatchesPage() {
  const matches = z
    .array(cricketMatchSchema)
    .parse(await authenticatedData('/api/matches'));
  return (
    <>
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
        {matches.length ? (
          <MatchList matches={matches} />
        ) : (
          <EmptyState
            title="Every match deserves a record."
            description="Add a completed match and the performances of players in your roster."
            href="/dashboard/matches/new"
            action="Record your first match"
          />
        )}
      </section>
    </>
  );
}
