import { notFound } from 'next/navigation';
import { z } from 'zod';
import { authenticatedPlayer, authenticatedTeams } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { PlayerForm } from '@/components/player-form';
export const metadata = { title: 'Edit player' };
export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const player = await authenticatedPlayer(id);
  if (!player) notFound();
  const teams = await authenticatedTeams();
  return (
    <>
      <PageHeading
        title={`Update ${player.name}.`}
        description="Keep player details and career statistics accurate."
      />
      <PlayerForm player={player} teams={teams} />
    </>
  );
}
