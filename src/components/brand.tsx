import Link from 'next/link';
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand${light ? ' brand-light' : ''}`}
      aria-label="Criico home"
    >
      criico
      <span className="wicket-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </Link>
  );
}
