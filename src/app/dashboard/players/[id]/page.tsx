import { notFound } from 'next/navigation';
import { z } from 'zod';
import { authenticatedData } from '@/lib/backend';
import { playerSchema } from '@/lib/contracts';
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
  const players = z
    .array(playerSchema)
    .parse(await authenticatedData('/api/players'));
  const player = players.find((p) => p.id === id);
  if (!player) notFound();
  return (
    <>
      <PageHeading
        title={`Update ${player.name}.`}
        description="Keep player details and career statistics accurate."
      />
      <PlayerForm player={player} />
    </>
  );
}
