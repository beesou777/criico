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

  it('keeps leaderboard filtering and sorting options available', () => {
    mocks.push.mockClear();
    render(
      <PlayerFilters
        query={{ page: 1, limit: 20, search: '' }}
        pathname="/dashboard/leaderboard"
        total={1}
        teams={[
          {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'Lions',
          },
        ]}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by team' }), {
      target: { value: '00000000-0000-4000-8000-000000000001' },
    });
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Sort players by' }),
      {
        target: { value: 'runs' },
      },
    );
    const form = screen.getByRole('button', { name: 'Apply' }).closest('form');
    if (!form) throw new Error('Leaderboard filter form missing.');
    fireEvent.submit(form);

    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/leaderboard?limit=20&page=1&teamId=00000000-0000-4000-8000-000000000001&sort=runs',
      { scroll: false },
    );
  });
});
