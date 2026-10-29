import { PageHeading } from '@/components/page-heading';
import { PlayerForm } from '@/components/player-form';
export const metadata = { title: 'Add player' };
export default function NewPlayerPage() {
  return (
    <>
      <PageHeading
        title="A new name on the sheet."
        description="Add a player and give their performances a place to count."
      />
      <PlayerForm />
    </>
  );
}
