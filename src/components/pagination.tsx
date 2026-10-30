'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useListNavigation, navigateListLink } from './list-transition';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageHref, pageNumbers, type PaginationMeta } from '@/lib/pagination';

export function Pagination({ meta }: { meta: PaginationMeta }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const { pending, navigate } = useListNavigation();
  const params = new URLSearchParams(search.toString());
  const first = meta.totalItems === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.totalItems);
  const limits = [...new Set([10, 20, 50, 100, meta.limit])].sort(
    (a, b) => a - b,
  );

  return (
    <div
      className="pagination flex items-center gap-[18px] flex-wrap p-[18px_22px] border-t border-border text-[11px] max-md:p-[16px_14px] max-md:gap-[14px]"
      aria-busy={pending}
    >
      <p
        className="pagination-summary text-secondary tabular-nums"
        aria-live="polite"
      >
        {first}–{last} of {meta.totalItems} results
      </p>
      <label className="page-size flex flex-row items-center gap-[9px] ml-auto text-[10px] text-secondary">
        Rows per page
        <select
          autoComplete="off"
          className="w-auto min-h-[36px] p-[6px_28px_6px_10px] text-[11px] rounded-[4px] border border-[#b9c4b2] bg-white text-ink"
          aria-label="Rows per page"
          value={meta.limit}
          disabled={pending}
          onChange={(event) =>
            navigate(pageHref(pathname, params, 1, Number(event.target.value)))
          }
        >
          {limits.map((limit) => (
            <option key={limit} value={limit}>
              {limit}
            </option>
          ))}
        </select>
      </label>
      <nav
        aria-label="Pagination"
        className="page-links flex items-center gap-[5px] max-md:w-full max-md:justify-center max-md:gap-[3px]"
      >
        {meta.previousPage ? (
          <Link
            className="page-link page-direction inline-flex min-w-[36px] min-h-[36px] items-center justify-center gap-[5px] rounded-[4px] border border-transparent p-[6px_10px] text-[11px] tabular-nums hover:bg-soft text-foreground transition-colors max-md:min-w-[34px] max-md:p-[6px_8px]"
            href={pageHref(pathname, params, meta.previousPage)}
            onClick={(event) =>
              navigateListLink(
                event,
                pageHref(pathname, params, meta.previousPage ?? 1),
                navigate,
              )
            }
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span className="max-md:hidden">Previous</span>
          </Link>
        ) : (
          <span
            className="page-link page-direction inline-flex min-w-[36px] min-h-[36px] items-center justify-center gap-[5px] rounded-[4px] border border-transparent p-[6px_10px] text-[11px] tabular-nums bg-[#f0f2e9] text-[#71796e] cursor-not-allowed max-md:min-w-[34px] max-md:p-[6px_8px]"
            aria-disabled="true"
          >
            <ChevronLeft size={16} />
            <span className="max-md:hidden">Previous</span>
          </span>
        )}
        {pageNumbers(meta.page, meta.totalPages).map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`gap-${index}`}
              className="page-gap text-secondary px-1 text-[11px]"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Link
              key={page}
              href={pageHref(pathname, params, page)}
              onClick={(event) =>
                navigateListLink(
                  event,
                  pageHref(pathname, params, page),
                  navigate,
                )
              }
              className={clsx(
                'page-link inline-flex min-w-[36px] min-h-[36px] items-center justify-center gap-[5px] rounded-[4px] border border-transparent p-[6px_10px] text-[11px] tabular-nums transition-colors max-md:min-w-[34px] max-md:p-[6px_8px]',
                page === meta.page
                  ? 'bg-accent text-paper font-semibold hover:bg-[#b51235]'
                  : 'hover:bg-soft text-foreground',
              )}
              aria-label={`Page ${page}`}
              aria-current={page === meta.page ? 'page' : undefined}
            >
              {page}
            </Link>
          ),
        )}
        {meta.nextPage ? (
          <Link
            className="page-link page-direction inline-flex min-w-[36px] min-h-[36px] items-center justify-center gap-[5px] rounded-[4px] border border-transparent p-[6px_10px] text-[11px] tabular-nums hover:bg-soft text-foreground transition-colors max-md:min-w-[34px] max-md:p-[6px_8px]"
            href={pageHref(pathname, params, meta.nextPage)}
            onClick={(event) =>
              navigateListLink(
                event,
                pageHref(pathname, params, meta.nextPage ?? meta.page),
                navigate,
              )
            }
            aria-label="Next page"
          >
            <span className="max-md:hidden">Next</span>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span
            className="page-link page-direction inline-flex min-w-[36px] min-h-[36px] items-center justify-center gap-[5px] rounded-[4px] border border-transparent p-[6px_10px] text-[11px] tabular-nums bg-[#f0f2e9] text-[#71796e] cursor-not-allowed max-md:min-w-[34px] max-md:p-[6px_8px]"
            aria-disabled="true"
          >
            <span className="max-md:hidden">Next</span>
            <ChevronRight size={16} />
          </span>
        )}
      </nav>
    </div>
  );
}
