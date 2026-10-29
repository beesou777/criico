import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="empty-state not-found">
      <h1>Outside the boundary.</h1>
      <p>This page or player could not be found.</p>
      <Link href="/dashboard" className="button button-primary">
        Back to the clubhouse
      </Link>
    </main>
  );
}
