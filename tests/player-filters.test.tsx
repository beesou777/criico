import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerFilters } from '../src/components/player-filters';
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
describe('Search navigation', () => {
  it('uses client navigation, resets the page, and preserves scroll position', () => {
    render(
      <PlayerFilters
        query={{ page: 3, limit: 20, search: '' }}
        pathname="/dashboard/players"
        total={60}
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search players' }), {
      target: { value: ' Aarav ' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by role' }), {
      target: { value: 'Bowler' },
    });
    const form = screen.getByRole('button', { name: 'Apply' }).closest('form');
    if (!form) throw new Error('Search form missing.');
    expect(fireEvent.submit(form)).toBe(false);
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/players?limit=20&page=1&search=Aarav&role=Bowler',
      { scroll: false },
    );
  });
});
