'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
    <div className="pagination" aria-busy={pending}>
      <p className="pagination-summary" aria-live="polite">
        {first}–{last} of {meta.totalItems} results
      </p>
      <label className="page-size">
        Rows per page
        <select
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
      <nav aria-label="Pagination" className="page-links">
        {meta.previousPage ? (
          <Link
            className="page-link page-direction"
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
            <span>Previous</span>
          </Link>
        ) : (
          <span className="page-link page-direction" aria-disabled="true">
            <ChevronLeft size={16} />
            <span>Previous</span>
          </span>
        )}
        {pageNumbers(meta.page, meta.totalPages).map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`gap-${index}`} className="page-gap" aria-hidden="true">
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
              className="page-link page-number"
              aria-label={`Page ${page}`}
              aria-current={page === meta.page ? 'page' : undefined}
            >
              {page}
            </Link>
          ),
        )}
        {meta.nextPage ? (
          <Link
            className="page-link page-direction"
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
            <span>Next</span>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className="page-link page-direction" aria-disabled="true">
            <span>Next</span>
            <ChevronRight size={16} />
          </span>
        )}
      </nav>
    </div>
  );
}
