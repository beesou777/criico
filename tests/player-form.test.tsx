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
});
