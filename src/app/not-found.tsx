import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main"
      className="not-found empty-state text-center p-[55px_25px] flex items-center flex-col text-primary min-h-dvh justify-center"
    >
      <h1 className="text-[20px] font-bold tracking-[-0.03em] mt-[18px] text-foreground">
        Outside the boundary.
      </h1>
      <p className="text-xs text-secondary max-w-[42ch] mt-3">
        This page or player could not be found.
      </p>
      <Link
        href="/dashboard"
        className="button button-primary inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-xs mt-[25px]"
      >
        Back to the clubhouse
      </Link>
    </main>
  );
}
