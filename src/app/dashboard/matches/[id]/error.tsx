'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MatchDetailsError({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.error('Could not load this match. Please try again.');
  }, []);
  return (
    <section className="section-panel match-not-found" role="alert">
      <h1>Match details are unavailable.</h1>
      <p>There was a problem retrieving this match from the matchbook.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
      <Link className="button button-outline" href="/dashboard/matches">
        Back to matchbook
      </Link>
    </section>
  );
}
