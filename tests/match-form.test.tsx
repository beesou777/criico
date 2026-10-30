import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function searchPlayer(playerName: string, teamName: string) {
  fireEvent.change(
    screen.getByRole('searchbox', { name: `Search ${teamName} squad` }),
    { target: { value: playerName } },
  );
}

function addPlayer(playerName: string, teamName: string) {
  searchPlayer(playerName, teamName);
  fireEvent.click(
    screen.getByRole('button', { name: `Add ${playerName} to match` }),
  );
}

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

  it('shows team selectors without listing full squads until a search is entered', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    expect(screen.getByTestId('team-A-section')).toBeInTheDocument();
    expect(screen.getByTestId('team-B-section')).toBeInTheDocument();
    expect(screen.queryByText('Aasif Sheikh')).not.toBeInTheDocument();
    searchPlayer('Aasif', 'Janakpur Bolts');
    expect(screen.getByText('Aasif Sheikh')).toBeInTheDocument();
    expect(screen.queryByText('Dipendra Singh Airee')).not.toBeInTheDocument();
  });

  it('adds a selected player to the grouped table with zeroed figures', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);
    addPlayer('Aasif Sheikh', 'Janakpur Bolts');
    expect(
      screen.getByRole('table', { name: 'Player performance figures' }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('participant-aaaa1111-1111-1111-1111-111111111111'),
    ).toBeInTheDocument();

    // Inputs should default to 0
    const runsInput = screen.getByLabelText('Runs scored by Aasif Sheikh');
    const wicketsInput = screen.getByLabelText('Wickets taken by Aasif Sheikh');
    expect(runsInput).toHaveValue(0);
    expect(wicketsInput).toHaveValue(0);

    // Participant count in summary should update
    expect(document.querySelector('.submission-summary')).toHaveTextContent(
      '1 player participating',
    );
    expect(document.querySelector('.submission-summary')).toHaveTextContent(
      '1 Janakpur Bolts',
    );
  });

  it('CRITICAL: triggers UI toast notification when negative runs are submitted and aborts', async () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    addPlayer('Aasif Sheikh', 'Janakpur Bolts');

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

    expect(mocks.submitJSON).not.toHaveBeenCalled();
  });

  it('triggers UI toast notification when negative wickets are submitted', async () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    addPlayer('Lalit Rajbanshi', 'Janakpur Bolts');

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

  it('rejects more than 10 wickets for one player in a match', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    addPlayer('Lalit Rajbanshi', 'Janakpur Bolts');
    fireEvent.change(
      screen.getByLabelText('Wickets taken by Lalit Rajbanshi'),
      {
        target: { value: '11' },
      },
    );
    fireEvent.submit(
      screen.getByRole('button', { name: /record match/i }).closest('form')!,
    );

    expect(mocks.toastError).toHaveBeenCalledWith(
      'A player cannot take more than 10 wickets in one match.',
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

    addPlayer('Aasif Sheikh', 'Janakpur Bolts');
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

  it('preserves figures when another participant is added and a player is re-added', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);
    addPlayer('Aasif Sheikh', 'Janakpur Bolts');
    fireEvent.change(screen.getByLabelText('Runs scored by Aasif Sheikh'), {
      target: { value: '45' },
    });

    addPlayer('Lalit Rajbanshi', 'Janakpur Bolts');
    expect(screen.getByLabelText('Runs scored by Aasif Sheikh')).toHaveValue(
      45,
    );
    fireEvent.change(screen.getByLabelText('Runs scored by Lalit Rajbanshi'), {
      target: { value: '22' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Lalit Rajbanshi from match',
      }),
    );
    searchPlayer('Lalit Rajbanshi', 'Janakpur Bolts');
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Lalit Rajbanshi to match' }),
    );

    expect(screen.getByLabelText('Runs scored by Aasif Sheikh')).toHaveValue(
      45,
    );
    expect(screen.getByLabelText('Runs scored by Lalit Rajbanshi')).toHaveValue(
      22,
    );
  });

  it('revalidates selected players when a team changes and notifies user', () => {
    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    addPlayer('Aasif Sheikh', 'Janakpur Bolts');
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
    const savedMatchId = '88888888-8888-4888-8888-888888888888';
    mocks.submitJSON.mockResolvedValueOnce({
      match: {
        id: savedMatchId,
        teamA: 'Janakpur Bolts',
        teamB: 'Sudurpaschim Royals',
        result: 'A',
        playedAt: '2026-10-29',
      },
      replayed: false,
    });

    render(<MatchForm teams={mockTeams} players={mockPlayers} />);

    addPlayer('Aasif Sheikh', 'Janakpur Bolts');
    addPlayer('Dipendra Singh Airee', 'Sudurpaschim Royals');

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
    const [url, method, payload] = call as [
      string,
      string,
      { teamA: string; teamB: string; performances: unknown[] },
    ];
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
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        `/dashboard/matches/${savedMatchId}`,
      ),
    );
  });
});
