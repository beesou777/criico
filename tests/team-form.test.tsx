import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamForm } from '../src/components/team-form';

const mocks = vi.hoisted(() => ({
  submitJSON: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('../src/lib/client-api', () => ({ submitJSON: mocks.submitJSON }));

beforeEach(() => vi.clearAllMocks());

describe('TeamForm', () => {
  it('normalizes team names and clears only after successful creation', async () => {
    mocks.submitJSON.mockResolvedValueOnce({ id: 'team-id', name: 'Lions' });
    render(<TeamForm />);
    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: '  Lions  ' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() =>
      expect(mocks.submitJSON).toHaveBeenCalledWith('/api/teams', 'POST', {
        name: 'Lions',
      }),
    );
    await waitFor(() => expect(input).toHaveValue(''));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('preserves the entered name and reports a duplicate team error', async () => {
    mocks.submitJSON.mockRejectedValueOnce(
      new Error('You already have a team with this name.'),
    );
    render(<TeamForm />);
    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: 'Lions' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        'You already have a team with this name.',
      ),
    );
    expect(input).toHaveValue('Lions');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only names without sending a request', () => {
    render(<TeamForm />);
    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(mocks.error).toHaveBeenCalledWith(
      'Team name must have at least 2 non-space characters.',
    );
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });
});
