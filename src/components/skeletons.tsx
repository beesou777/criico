export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      className={`skeleton block bg-[#eadfe2] rounded animate-[skeleton-pulse_1.6s_ease-in-out_infinite] ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({
  columns = 7,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div
      className="table-scroll relative overflow-x-auto w-full"
      aria-hidden="true"
    >
      <table className="skeleton-table min-w-[620px] table-fixed w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, column) => (
              <th key={column} className="p-[15px_18px] bg-[#f0f2e9]">
                <Skeleton className="w-[90px] max-w-full h-3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="animate-[skeleton-pulse_1.6s_ease-in-out_infinite]">
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <td
                  className="h-[76px] p-[18px] border-t border-[#e6e9df] align-top"
                  key={column}
                >
                  <Skeleton
                    className={
                      column === 0
                        ? 'w-[145px] max-w-full h-[15px]'
                        : 'w-[90px] max-w-full h-3'
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
      <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
        <div>
          <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
            {title}
          </h1>
          <p className="text-secondary text-xs mt-2.5 max-w-[65ch]">
            {description}
          </p>
        </div>
        <Skeleton className="w-[150px] h-[47px]" />
      </div>
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        {!matches && (
          <div
            className="table-toolbar flex items-center gap-3.5 p-[18px_22px] border-b border-border max-md:p-3.5 max-md:gap-2.5 max-md:flex-wrap"
            aria-hidden="true"
          >
            <Skeleton className="w-[330px] max-w-[55%] h-[42px]" />
            <Skeleton className="w-[150px] h-[42px]" />
          </div>
        )}
        {matches ? (
          <div className="match-list">
            {Array.from({ length: 5 }, (_, index) => (
              <article
                className="border-b border-border p-[18px_24px] last:border-b-0 hover:bg-[#faf7f2] transition-colors"
                key={index}
              >
                <Skeleton className="w-[90px] h-2.5" />
                <Skeleton className="w-[230px] max-w-[85%] h-5 mt-3 mb-5" />
                <Skeleton className="w-[90px] h-2.5" />
              </article>
            ))}
          </div>
        ) : (
          <TableSkeleton />
        )}
        <div
          className="pagination flex items-center gap-4.5 flex-wrap p-[18px_22px] border-t border-border text-xs max-md:p-[16px_14px]"
          aria-hidden="true"
        >
          <Skeleton className="w-[120px] h-3" />
          <Skeleton className="w-[150px] h-9 ml-auto" />
        </div>
      </section>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="Loading clubhouse overview" aria-busy="true">
      <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
        <div>
          <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
            Your clubhouse.
          </h1>
          <p className="text-secondary text-xs mt-2.5 max-w-[65ch]">
            Your teams, matches, and player performances.
          </p>
        </div>
        <Skeleton className="w-[150px] h-[47px]" />
      </div>
      <section
        className="summary-row grid grid-cols-4 border-t border-b border-[#99ab92] mb-8 py-6 max-lg:grid-cols-2 max-lg:gap-y-6 max-md:grid-cols-1 max-md:gap-y-4 max-md:py-4"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="px-[22px] border-l border-border first:pl-0 first:border-l-0 max-lg:px-4 max-lg:[&:nth-child(2n+1)]:pl-0 max-lg:[&:nth-child(2n+1)]:border-l-0 max-md:p-[0_0_14px_0] max-md:border-l-0 max-md:border-b max-md:border-border last:max-md:border-b-0 last:max-md:pb-0"
            key={index}
          >
            <Skeleton className="w-[90px] h-3" />
            <Skeleton className="w-[95px] h-12 my-3.5" />
            <Skeleton className="w-[90px] h-3" />
          </div>
        ))}
      </section>
      <div className="overview-grid grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {['Top performances', 'Recent matches'].map((title) => (
          <section
            className="section-panel bg-card border border-border rounded-lg overflow-hidden"
            key={title}
          >
            <div className="section-heading flex items-center justify-between gap-[15px] p-[20px_23px] border-b border-border max-md:p-[18px]">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {title}
              </h2>
            </div>
            <div className="p-[25px] min-h-[285px]">
              <Skeleton className="w-[230px] max-w-[85%] h-[25px] mt-3 mb-5" />
              <Skeleton className="w-[90px] h-3" />
              <Skeleton className="w-[95px] h-12 my-3.5" />
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
      <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
        <Skeleton className="w-[230px] max-w-[85%] h-[25px] my-3" />
      </div>
      <div className="max-w-225 py-5">
        {Array.from({ length: 2 }, (_, section) => (
          <div
            className="p-[25px] mb-6 border border-border rounded-lg bg-card"
            key={section}
          >
            <Skeleton className="w-[230px] max-w-[85%] h-[25px] mt-3 mb-5" />
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-5">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field}>
                  <Skeleton className="w-[90px] max-w-full h-3" />
                  <Skeleton className="w-full h-[46px] mt-2.5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
