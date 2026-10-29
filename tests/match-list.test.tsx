import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MatchList } from '../src/components/match-list';

describe('MatchList navigation', () => {
  it('links each match card to its real match ID', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    render(
      <MatchList
        matches={[
          {
            id,
            teamA: 'Lions',
            teamB: 'Yaks',
            result: 'TIE',
            playedAt: '2025-01-02',
          },
        ]}
      />,
    );
    expect(
      screen.getByRole('link', { name: /Lions versus Yaks/i }),
    ).toHaveAttribute('href', `/dashboard/matches/${id}`);
  });
});
