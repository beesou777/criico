import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function MatchNotFound() {
  return (
    <section className="section-panel match-not-found" role="status">
      <BookOpen size={26} aria-hidden="true" />
      <h1>Match not found.</h1>
      <p>This match may not exist or may not belong to your clubhouse.</p>
      <Link className="button button-primary" href="/dashboard/matches">
        Back to matchbook
      </Link>
    </section>
  );
}
