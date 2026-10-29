import { Skeleton } from '@/components/skeletons';

export default function MatchDetailsLoading() {
  return (
    <div role="status" aria-label="Loading match details" aria-busy="true">
      <div className="page-heading">
        <div>
          <h1>Match details.</h1>
          <Skeleton className="skeleton-label" />
        </div>
        <Skeleton className="skeleton-action" />
      </div>
      <section className="section-panel match-detail-skeleton">
        <Skeleton className="skeleton-label" />
        <div className="match-detail-sides">
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-title" />
        </div>
      </section>
      <div className="match-performance-grid">
        {[0, 1].map((side) => (
          <section
            className="section-panel match-performance-skeleton"
            key={side}
          >
            <Skeleton className="skeleton-title" />
            {[0, 1, 2].map((row) => (
              <Skeleton className="skeleton-name" key={row} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
