'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
export default function DashboardError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error('Could not load the clubhouse. Please try again.');
  }, []);
  return (
    <div className="empty-state" role="alert">
      <h1>The clubhouse is temporarily unavailable.</h1>
      <p>Check that the backend and database are running, then try again.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
