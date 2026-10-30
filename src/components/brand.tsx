import Link from 'next/link';
import clsx from 'clsx';

export function Brand({
  light = false,
  className = '',
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={clsx(
        'brand inline-flex items-center gap-2.5 text-[34px] leading-none font-extrabold tracking-[-0.04em] no-underline',
        light ? 'brand-light text-paper' : 'text-foreground',
        className,
      )}
      aria-label="Criico home"
    >
      criico
      <span
        className="wicket-mark flex gap-[3px] h-[25px] relative mt-1 before:absolute before:w-4 before:h-0.5 before:bg-accent before:-top-[3px] before:-left-[1px]"
        aria-hidden="true"
      >
        <i className="w-[3px] h-[25px] bg-accent not-italic block" />
        <i className="w-[3px] h-[25px] bg-accent not-italic block" />
        <i className="w-[3px] h-[25px] bg-accent not-italic block" />
      </span>
    </Link>
  );
}
