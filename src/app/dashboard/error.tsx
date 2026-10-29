'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function DashboardError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error('Could not load the clubhouse. Please try again.');
  }, []);

  return (
    <div
      className="empty-state text-center p-[55px_25px] flex items-center flex-col text-primary"
      role="alert"
    >
      <h1 className="text-[20px] font-bold tracking-[-0.03em] mt-[18px] text-foreground">
        The clubhouse is temporarily unavailable.
      </h1>
      <p className="text-xs text-secondary max-w-[42ch] mt-3">
        Check that the backend and database are running, then try again.
      </p>
      <button
        className="button button-primary inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-xs mt-[25px] cursor-pointer"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
