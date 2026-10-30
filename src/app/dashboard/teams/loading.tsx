import { Skeleton } from '@/components/skeletons';

export default function TeamsLoading() {
  return (
    <div role="status" aria-label="Loading teams" aria-busy="true">
      <div className="page-heading mb-8 flex items-center justify-between gap-[25px] max-md:mb-[26px] max-md:flex-col max-md:items-start max-md:gap-5">
        <div>
          <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
            Your teams.
          </h1>
          <p className="mt-2.5 max-w-[65ch] text-xs text-secondary">
            Create the clubs you manage, then assign every player to the right
            side.
          </p>
        </div>
        <Skeleton className="h-[47px] w-[140px]" />
      </div>
      <Skeleton className="mb-[22px] h-6 w-[90px]" />
      <section className="section-panel overflow-visible rounded-lg border border-border bg-card p-[20px_22px_22px] max-sm:p-4">
        <Skeleton className="h-3 w-[620px] max-w-full" />
        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
          <Skeleton className="h-10 min-w-[220px] flex-1" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 bg-soft px-4 py-3 max-md:grid-cols-[2fr_1fr_100px]"
            aria-hidden="true"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="grid grid-cols-[2fr_1fr_1fr_100px] items-center gap-4 border-t border-border px-4 py-4 max-md:grid-cols-[2fr_1fr_100px]"
              key={index}
            >
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="ml-auto h-8 w-8" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
