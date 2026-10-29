import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '../src/components/pagination';
import { paginationMeta } from '../src/lib/pagination';
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/leaderboard',
  useSearchParams: () => new URLSearchParams('role=Bowler&page=2&limit=20'),
  useRouter: () => ({ push: mocks.push }),
}));
describe('Pagination controls', () => {
  it('displays ranges, preserves filters, and identifies the current page', () => {
    render(<Pagination meta={paginationMeta(156, { page: 2, limit: 20 })} />);
    expect(screen.getByText('21–40 of 156 results')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/dashboard/leaderboard?role=Bowler&page=3&limit=20',
    );
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows per page' }), {
      target: { value: '50' },
    });
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/leaderboard?role=Bowler&page=1&limit=50',
      { scroll: false },
    );
  });
  it('has no previous/next links for empty results', () => {
    render(<Pagination meta={paginationMeta(0, { page: 1, limit: 20 })} />);
    expect(screen.getByText('0–0 of 0 results')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Next page' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Previous page' }),
    ).not.toBeInTheDocument();
  });
});
