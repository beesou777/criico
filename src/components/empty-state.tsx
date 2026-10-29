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
    <div className="empty-state text-center p-[55px_25px] flex items-center flex-col text-primary">
      <UsersRound size={32} strokeWidth={1.4} />
      <h2 className="text-[20px] font-bold tracking-[-0.03em] mt-[18px] text-primary">
        {title}
      </h2>
      <p className="text-xs text-secondary max-w-[42ch] mt-3">
        {description}
      </p>
      {href && (
        <Link
          href={href}
          className="button button-primary inline-flex justify-center items-center gap-[9px] min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-xs mt-[25px]"
        >
          {action}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
