import { Skeleton } from '@/components/skeletons';

export default function TeamsLoading() {
  return (
    <div role="status" aria-label="Loading teams" aria-busy="true">
      <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
        <div>
          <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
            Your teams.
          </h1>
          <p className="text-secondary text-xs mt-2.5 max-w-[65ch]">
            Loading your teams and player counts.
          </p>
        </div>
      </div>
      <section className="team-panel section-panel bg-card border border-border rounded-lg overflow-hidden p-[20px_22px_22px] max-sm:p-4">
        <div
          className="team-create-form flex items-end gap-[18px] p-[2px_0_22px] border-b border-border max-sm:items-stretch max-sm:flex-col"
          aria-hidden="true"
        >
          <div className="flex-1">
            <Skeleton className="w-[90px] h-3 mb-2" />
            <Skeleton className="w-full h-[46px]" />
          </div>
          <Skeleton className="w-[150px] h-[46px]" />
        </div>
        <div
          className="team-list grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-[14px] mt-5"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="team-card-skeleton grid grid-cols-[38px_1fr] items-center gap-[6px_12px] min-h-[78px] p-4 border border-border rounded-lg bg-background"
              key={index}
            >
              <Skeleton className="team-mark-skeleton row-span-2 w-[38px] h-[38px] rounded-full" />
              <Skeleton className="w-[120px] max-w-full h-3.5" />
              <Skeleton className="w-[80px] max-w-full h-3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
