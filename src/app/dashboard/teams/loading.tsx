import { Skeleton } from '@/components/skeletons';

export default function TeamsLoading() {
  return (
    <div role="status" aria-label="Loading teams" aria-busy="true">
      <div className="page-heading">
        <div>
          <h1>Your teams.</h1>
          <p>Loading your teams and player counts.</p>
        </div>
      </div>
      <section className="section-panel team-panel">
        <div className="team-create-form" aria-hidden="true">
          <Skeleton className="skeleton-input" />
          <Skeleton className="skeleton-action" />
        </div>
        <div className="team-list" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="team-card-skeleton" key={index}>
              <Skeleton className="team-mark-skeleton" />
              <Skeleton className="skeleton-name" />
              <Skeleton className="skeleton-label" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
