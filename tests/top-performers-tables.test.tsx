import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopPerformersTables } from '../src/components/top-performers-tables';
import type { Player, RankedPlayer } from '../src/lib/contracts';

const mockBatters: Player[] = [
  {
    id: 'b1-0000-0000-0000-000000000001',
    name: 'Dipendra Singh Airee',
    role: 'All-rounder',
    basePrice: 2500000,
    matchesPlayed: 24,
    totalRuns: 1480,
    totalWickets: 38,
    teamId: 't1-0000-0000-0000-000000000001',
    teamName: 'Nepal Showcase XI',
    updatedAt: '2026-10-29T10:00:00.000000Z',
  },
  {
    id: 'b2-0000-0000-0000-000000000002',
    name: 'Kushal Bhurtel',
    role: 'Batsman',
    basePrice: 2000000,
    matchesPlayed: 21,
    totalRuns: 1320,
    totalWickets: 15,
    teamId: 't1-0000-0000-0000-000000000001',
    teamName: 'Nepal Showcase XI',
    updatedAt: '2026-10-29T10:00:00.000000Z',
  },
];

const mockBowlers: Player[] = [
  {
    id: 'w1-0000-0000-0000-000000000001',
    name: 'Sandeep Lamichhane',
    role: 'Bowler',
    basePrice: 2500000,
    matchesPlayed: 25,
    totalRuns: 180,
    totalWickets: 74,
    teamId: 't1-0000-0000-0000-000000000001',
    teamName: 'Nepal Showcase XI',
    updatedAt: '2026-10-29T10:00:00.000000Z',
  },
  {
    id: 'w2-0000-0000-0000-000000000002',
    name: 'Karan KC',
    role: 'All-rounder',
    basePrice: 2000000,
    matchesPlayed: 23,
    totalRuns: 580,
    totalWickets: 45,
    teamId: 't1-0000-0000-0000-000000000001',
    teamName: 'Nepal Showcase XI',
    updatedAt: '2026-10-29T10:00:00.000000Z',
  },
];

const mockImpactPlayers: RankedPlayer[] = [
  {
    ...mockBatters[0]!,
    score: {
      total: 2636,
      runs: 1776,
      wickets: 760,
      roleBonus: 0,
      experience: 100,
      keeper: 0,
    },
    experienceStatus: 'Veteran',
  },
];

describe('TopPerformersTables', () => {
  it('renders separate tables for batting and bowling leaders by default', () => {
    render(<TopPerformersTables batters={mockBatters} bowlers={mockBowlers} />);

    expect(
      screen.getByRole('heading', { name: 'Top Run Scorers' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Top Wicket Takers' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Dipendra Singh Airee')).toBeInTheDocument();
    expect(screen.getByText('Sandeep Lamichhane')).toBeInTheDocument();
    expect(screen.getByText('1,480')).toBeInTheDocument();
    expect(screen.getByText('74')).toBeInTheDocument();
  });

  it('switches between batting and bowling tabs', () => {
    render(<TopPerformersTables batters={mockBatters} bowlers={mockBowlers} />);

    // Switch to Batting
    fireEvent.click(screen.getByRole('tab', { name: /batting/i }));
    expect(
      screen.getByRole('heading', { name: 'Top Run Scorers' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Top Wicket Takers' }),
    ).not.toBeInTheDocument();

    // Switch to Bowling
    fireEvent.click(screen.getByRole('tab', { name: /bowling/i }));
    expect(
      screen.queryByRole('heading', { name: 'Top Run Scorers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Top Wicket Takers' }),
    ).toBeInTheDocument();
  });

  it('displays empty state when both lists are empty', () => {
    render(<TopPerformersTables batters={[]} bowlers={[]} />);
    expect(
      screen.getByText('Your first player starts the story.'),
    ).toBeInTheDocument();
  });

  it('shows Impact Score leaders in the impact tab', () => {
    render(
      <TopPerformersTables
        batters={mockBatters}
        bowlers={mockBowlers}
        impactPlayers={mockImpactPlayers}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Impact' }));
    expect(
      screen.getByRole('heading', { name: 'Impact leaders' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2,636')).toBeInTheDocument();
  });
});
