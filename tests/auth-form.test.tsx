import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AuthForm } from '../src/components/auth-form';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/actions', () => ({ registerAction: vi.fn() }));
vi.mock('@/lib/client-api', () => ({
  submitJSON: vi.fn(() => new Promise(() => {})),
}));
it('keeps an accessible button name while signing in', async () => {
  render(<AuthForm mode="login" />);
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'organizer@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'example-password' },
  });
  const form = screen
    .getByRole('button', { name: 'Enter the clubhouse' })
    .closest('form');
  if (!form) throw new Error('Login form missing.');
  fireEvent.submit(form);
  const button = await screen.findByRole('button', { name: 'Signing in…' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');
});
