'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MatchDetailsError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error('Could not load this match. Please try again.');
  }, []);

  return (
    <section
      className="section-panel bg-card border border-border rounded-lg overflow-hidden flex items-center flex-col gap-3 p-[48px_24px] text-center mt-2"
      role="alert"
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Match details are unavailable.
      </h1>
      <p className="text-secondary text-xs">
        There was a problem retrieving this match from the matchbook.
      </p>
      <div className="flex gap-3 mt-4">
        <button
          className="button button-primary inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] bg-accent text-white hover:bg-accent-hover text-xs cursor-pointer transition-colors"
          onClick={reset}
        >
          Try again
        </button>
        <Link
          className="button button-outline inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] bg-transparent hover:bg-soft text-xs whitespace-nowrap transition-colors"
          href="/dashboard/matches"
        >
          Back to matchbook
        </Link>
      </div>
    </section>
  );
}
