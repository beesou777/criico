import { Skeleton } from '@/components/skeletons';

export default function MatchDetailsLoading() {
  return (
    <div role="status" aria-label="Loading match details" aria-busy="true">
      <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
        <div>
          <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
            Match details.
          </h1>
          <Skeleton className="mt-2.5 h-3 w-[150px] max-w-full" />
        </div>
        <Skeleton className="h-[47px] w-[150px]" />
      </div>
      <section className="match-detail-skeleton section-panel mb-8 w-full overflow-hidden rounded-lg border border-border bg-card p-[24px_28px] max-md:p-[18px_16px]">
        <Skeleton className="h-3 w-[90px] max-w-full" />
        <div className="match-detail-sides mt-6 grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-3 max-md:mt-[18px]">
          <Skeleton className="h-[86px] w-full rounded-[6px]" />
          <Skeleton className="h-[86px] w-full rounded-[6px]" />
        </div>
      </section>
      <div className="match-performance-grid grid grid-cols-2 items-start gap-[18px] max-md:grid-cols-1 max-md:gap-3">
        {[0, 1].map((side) => (
          <section
            className="match-performance-skeleton section-panel grid w-full gap-[18px] overflow-hidden rounded-lg border border-border bg-card p-[22px]"
            key={side}
          >
            <Skeleton className="h-6 w-[70%] max-w-full" />
            {[0, 1, 2].map((row) => (
              <Skeleton className="h-[15px] w-full max-w-full" key={row} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
