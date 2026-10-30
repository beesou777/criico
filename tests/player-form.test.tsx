import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerForm } from '../src/components/player-form';
const mocks = vi.hoisted(() => ({ toastError: vi.fn(), submitJSON: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/client-api', () => ({ submitJSON: mocks.submitJSON }));

const existingPlayer = {
  id: '405be0dc-9ae6-43d9-b612-d52f1b538709',
  name: 'Bishwa',
  role: 'Batsman' as const,
  basePrice: 12000,
  matchesPlayed: 2,
  totalRuns: 20,
  totalWickets: 0,
  teamId: '405be0dc-9ae6-43d9-b612-d52f1b538710',
  teamName: 'Biratnagar Kings',
  updatedAt: '2026-10-29T09:00:00.123456Z',
};
describe('Player form validation', () => {
  it('shows an error toast and does not save negative total runs', () => {
    render(<PlayerForm />);
    fireEvent.change(screen.getByLabelText('Player name'), {
      target: { value: 'Aarav' },
    });
    fireEvent.change(screen.getByLabelText('Total runs'), {
      target: { value: '-10' },
    });
    const form = screen
      .getByRole('button', { name: 'Add to squad' })
      .closest('form');
    if (!form) throw new Error('Player form was not rendered.');
    fireEvent.submit(form);
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Total runs must be zero or greater.',
    );
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });

  it('opens an in-app confirmation dialog before deleting a player', () => {
    render(<PlayerForm player={existingPlayer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete player' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Remove this player?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to remove Bishwa from the squad?',
      ),
    ).toBeInTheDocument();
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });
});
