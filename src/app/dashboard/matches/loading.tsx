import { ListPageSkeleton } from '@/components/skeletons';
export default function MatchesLoading() {
  return (
    <ListPageSkeleton
      title="The matchbook."
      description="A record of the games your community played."
      matches
    />
  );
}
