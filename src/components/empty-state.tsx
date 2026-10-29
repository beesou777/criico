import Link from 'next/link';
import { ArrowRight, UsersRound } from 'lucide-react';
export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <UsersRound size={32} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link href={href} className="button button-primary">
          {action}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
