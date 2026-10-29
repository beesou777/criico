export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({
  columns = 7,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="table-scroll" aria-hidden="true">
      <table className="skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, column) => (
              <th key={column}>
                <Skeleton className="skeleton-label" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <td key={column}>
                  <Skeleton
                    className={
                      column === 0 ? 'skeleton-name' : 'skeleton-label'
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListPageSkeleton({
  title,
  description,
  matches = false,
}: {
  title: string;
  description: string;
  matches?: boolean;
}) {
  return (
    <div role="status" aria-label="Loading records" aria-busy="true">
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Skeleton className="skeleton-action" />
      </div>
      <section className="section-panel">
        {!matches && (
          <div className="table-toolbar" aria-hidden="true">
            <Skeleton className="skeleton-search" />
            <Skeleton className="skeleton-action" />
          </div>
        )}
        {matches ? (
          <div className="match-list">
            {Array.from({ length: 5 }, (_, index) => (
              <article key={index}>
                <Skeleton className="skeleton-label" />
                <Skeleton className="skeleton-title" />
                <Skeleton className="skeleton-label" />
              </article>
            ))}
          </div>
        ) : (
          <TableSkeleton />
        )}
        <div className="pagination" aria-hidden="true">
          <Skeleton className="skeleton-label" />
          <Skeleton className="skeleton-action" />
        </div>
      </section>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="Loading clubhouse overview" aria-busy="true">
      <div className="page-heading">
        <div>
          <h1>Your clubhouse.</h1>
          <p>Your teams, matches, and player performances.</p>
        </div>
        <Skeleton className="skeleton-action" />
      </div>
      <section className="summary-row" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton className="skeleton-label" />
            <Skeleton className="skeleton-stat" />
            <Skeleton className="skeleton-label" />
          </div>
        ))}
      </section>
      <div className="overview-grid">
        {['Leading impact', 'Recent matches'].map((title) => (
          <section className="section-panel" key={title}>
            <div className="section-heading">
              <h2>{title}</h2>
            </div>
            <div className="skeleton-panel">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-label" />
              <Skeleton className="skeleton-stat" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div role="status" aria-label="Loading form" aria-busy="true">
      <div className="page-heading">
        <Skeleton className="skeleton-title" />
      </div>
      <div className="editor-form">
        {Array.from({ length: 2 }, (_, section) => (
          <div className="skeleton-form-section" key={section}>
            <Skeleton className="skeleton-title" />
            <div className="form-grid">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field}>
                  <Skeleton className="skeleton-label" />
                  <Skeleton className="skeleton-input" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
