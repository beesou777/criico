import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MatchForm } from '../src/components/match-form';
import type { PlayerOption, Team } from '../src/lib/contracts';

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
  submitJSON: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
    info: mocks.toastInfo,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/lib/client-api', () => ({
  submitJSON: mocks.submitJSON,
}));

const mockTeams: Team[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Janakpur Bolts' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sudurpaschim Royals' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Biratnagar Kings' },
];

const mockPlayers: PlayerOption[] = [
  {
    id: 'aaaa1111-1111-1111-1111-111111111111',
    name: 'Aasif Sheikh',
    role: 'Wicketkeeper',
    teamId: '11111111-1111-1111-1111-111111111111',
    teamName: 'Janakpur Bolts',
  },
  {
    id: 'aaaa2222-2222-2222-2222-222222222222',
    name: 'Lalit Rajbanshi',
    role: 'Bowler',
    teamId: '11111111-1111-1111-1111-111111111111',
    teamName: 'Janakpur Bolts',
  },
  {
    id: 'bbbb1111-1111-1111-1111-111111111111',
    name: 'Dipendra Singh Airee',
    role: 'All-rounder',
    teamId: '22222222-2222-2222-2222-222222222222',
    teamName: 'Sudurpaschim Royals',
  },
  {
    id: 'bbbb2222-2222-2222-2222-222222222222',
    name: 'Hemant Dhami',
    role: 'Bowler',
    teamId: '22222222-2222-2222-2222-222222222222',
    teamName: 'Sudurpaschim Royals',
  },
];

describe('MatchForm UI & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders match details with team selectors, VS indicator, date, and result', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    expect(screen.getByLabelText(/select team a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select team b/i)).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    expect(screen.getByLabelText(/match date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/official result/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /record match/i }),
    ).toBeInTheDocument();
  });

  it('displays the two distinct squad sections for Team A and Team B', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    expect(screen.getByTestId('team-A-section')).toBeInTheDocument();
    expect(screen.getByTestId('team-B-section')).toBeInTheDocument();

    // Check that available players for Team A are visible with roles
    expect(screen.getByText('Aasif Sheikh')).toBeInTheDocument();
    expect(screen.getByText('Lalit Rajbanshi')).toBeInTheDocument();

    // Check available players for Team B
    expect(screen.getByText('Dipendra Singh Airee')).toBeInTheDocument();
    expect(screen.getByText('Hemant Dhami')).toBeInTheDocument();
  });

  it('adds player to active figures and defaults runs and wickets to zero', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Click "Add" on Aasif Sheikh
    const addAasifBtn = screen.getByRole('button', {
      name: 'Add Aasif Sheikh to match',
    });
    fireEvent.click(addAasifBtn);

    // Active participant card should appear
    expect(
      screen.getByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).toBeInTheDocument();

    // Inputs should default to 0
    const runsInput = screen.getByLabelText('Runs scored by Aasif Sheikh');
    const wicketsInput = screen.getByLabelText('Wickets taken by Aasif Sheikh');
    expect(runsInput).toHaveValue(0);
    expect(wicketsInput).toHaveValue(0);

    // Participant count in summary should update
    expect(screen.getByText('1 participant')).toBeInTheDocument();
    expect(screen.getByText(/1 from Janakpur Bolts/i)).toBeInTheDocument();
  });

  it('CRITICAL: triggers UI toast notification when negative runs are submitted and aborts', async () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Add Aasif Sheikh
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Aasif Sheikh to match' }),
    );

    // Set negative runs (-15)
    const runsInput = screen.getByLabelText('Runs scored by Aasif Sheikh');
    fireEvent.change(runsInput, { target: { value: '-15' } });

    // Submit form
    const form = screen
      .getByRole('button', { name: /record match/i })
      .closest('form')!;
    fireEvent.submit(form);

    // Expect toast error notification
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Total runs must be zero or greater.',
    );

    // Expect inline error and no API call
    expect(screen.getByText(/must be ≥ 0/i)).toBeInTheDocument();
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });

  it('triggers UI toast notification when negative wickets are submitted', async () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Add Lalit Rajbanshi
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Lalit Rajbanshi to match' }),
    );

    // Set negative wickets (-2)
    const wicketsInput = screen.getByLabelText(
      'Wickets taken by Lalit Rajbanshi',
    );
    fireEvent.change(wicketsInput, { target: { value: '-2' } });

    // Submit form
    const form = screen
      .getByRole('button', { name: /record match/i })
      .closest('form')!;
    fireEvent.submit(form);

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Total wickets must be zero or greater.',
    );
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });

  it('triggers UI toast notification when no players are selected', async () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    const form = screen
      .getByRole('button', { name: /record match/i })
      .closest('form')!;
    fireEvent.submit(form);

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Select at least one participating player.',
    );
    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });

  it('allows removing a participant and re-enabling them in the available squad', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Add Aasif
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Aasif Sheikh to match' }),
    );
    expect(
      screen.getByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).toBeInTheDocument();

    // Click remove
    const removeBtn = screen.getByRole('button', {
      name: 'Remove Aasif Sheikh from match',
    });
    fireEvent.click(removeBtn);

    // Card should be gone
    expect(
      screen.queryByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).not.toBeInTheDocument();

    // Add button should be back in available squad
    expect(
      screen.getByRole('button', { name: 'Add Aasif Sheikh to match' }),
    ).toBeInTheDocument();
  });

  it('revalidates selected players when a team changes and notifies user', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Add Aasif from Janakpur Bolts (Team A)
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Aasif Sheikh to match' }),
    );
    expect(
      screen.getByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).toBeInTheDocument();

    // Change Team A to Biratnagar Kings
    const teamASelect = screen.getByLabelText(/select team a/i);
    fireEvent.change(teamASelect, { target: { value: 'Biratnagar Kings' } });

    // Toast notification informing user
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      'Player selections updated to match the newly selected teams.',
    );

    // Aasif should have been removed since he belongs to Janakpur Bolts
    expect(
      screen.queryByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).not.toBeInTheDocument();
  });

  it('submits valid match figures and calls submitJSON with expected payload', async () => {
    mocks.submitJSON.mockResolvedValueOnce({ match: { id: 'm-1' } });

    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    // Add Aasif (Team A) and Dipendra (Team B)
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Aasif Sheikh to match' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add Dipendra Singh Airee to match',
      }),
    );

    // Enter performance figures
    fireEvent.change(screen.getByLabelText('Runs scored by Aasif Sheikh'), {
      target: { value: '45' },
    });
    fireEvent.change(
      screen.getByLabelText('Wickets taken by Dipendra Singh Airee'),
      {
        target: { value: '2' },
      },
    );

    const form = screen
      .getByRole('button', { name: /record match/i })
      .closest('form')!;
    fireEvent.submit(form);

    expect(mocks.submitJSON).toHaveBeenCalledTimes(1);
    const call = mocks.submitJSON.mock.calls[0];
    expect(call).toBeDefined();
    const [url, method, payload] = call as [string, string, { teamA: string; teamB: string; performances: unknown[] }];
    expect(url).toBe('/api/matches');
    expect(method).toBe('POST');
    expect(payload.teamA).toBe('Janakpur Bolts');
    expect(payload.teamB).toBe('Sudurpaschim Royals');
    expect(payload.performances).toEqual([
      {
        playerId: 'aaaa1111-1111-1111-1111-111111111111',
        teamSide: 'A',
        runs: 45,
        wickets: 0,
      },
      {
        playerId: 'bbbb1111-1111-1111-1111-111111111111',
        teamSide: 'B',
        runs: 0,
        wickets: 2,
      },
    ]);
  });
});
