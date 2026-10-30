import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function MatchNotFound() {
  return (
    <section
      className="match-not-found section-panel bg-card border border-border rounded-lg overflow-hidden flex items-center flex-col gap-3 p-[48px_24px] text-center mt-2"
      role="status"
    >
      <BookOpen size={26} aria-hidden="true" className="text-secondary" />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Match not found.</h1>
      <p className="text-secondary text-xs">This match may not exist or may not belong to your clubhouse.</p>
      <Link
        className="button button-primary inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] bg-accent text-white hover:bg-accent-hover text-xs transition-colors mt-2"
        href="/dashboard/matches"
      >
        Back to matchbook
      </Link>
    </section>
  );
}
