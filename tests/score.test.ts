import { describe, expect, it } from 'vitest';
import { calculateImpactScore } from '../src/lib/score';

describe('Custom Impact Score Formula', () => {
  it('applies bowler weighting (wickets * 1.5 * 20) and a rookie penalty (-50) even at zero matches', () => {
    // Bowler with 0 matches, 0 runs, 2 wickets:
    // runs = 0
    // wickets = 2 * 20 * 1.5 = 60
    // experience = -50 (matches < 5)
    // total = 60 - 50 = 10
    expect(
      calculateImpactScore({
        role: 'Bowler',
        matchesPlayed: 0,
        totalRuns: 0,
        totalWickets: 2,
      }),
    ).toEqual({
      total: 10,
      runs: 0,
      wickets: 60,
      experience: -50,
      keeper: 0,
    });

    // Bowler with 0 matches, 0 wickets:
    // total = 0 - 50 = -50 (negative scores are valid and not clamped)
    expect(
      calculateImpactScore({
        role: 'Bowler',
        matchesPlayed: 0,
        totalRuns: 0,
        totalWickets: 0,
      }).total,
    ).toBe(-50);
  });

  it('gives a high-run keeper exactly the +30 keeper bonus and NO bowler multiplier', () => {
    // Wicketkeeper with 10 matches, 1000 runs, 10 wickets:
    // runs = 1000 * 1.2 = 1200
    // wickets = 10 * 20 = 200 (standard wicket multiplier, no bowler 1.5x)
    // experience = 0 (between 5 and 20)
    // keeper = 30
    // total = 1200 + 200 + 30 = 1430
    expect(
      calculateImpactScore({
        role: 'Wicketkeeper',
        matchesPlayed: 10,
        totalRuns: 1000,
        totalWickets: 10,
      }),
    ).toEqual({
      total: 1430,
      runs: 1200,
      wickets: 200,
      experience: 0,
      keeper: 30,
    });
  });

  it.each([
    [4, -50],  // < 5 matches: -50 penalty
    [5, 0],    // exactly 5 matches: no penalty or bonus
    [20, 0],   // exactly 20 matches: no penalty or bonus
    [21, 100], // > 20 matches: +100 veteran bonus
  ])('handles the experience boundary at %i matches', (matchesPlayed, expected) => {
    expect(
      calculateImpactScore({
        role: 'All-rounder',
        matchesPlayed,
        totalRuns: 0,
        totalWickets: 0,
      }).total,
    ).toBe(expected);
  });

  it('combines a veteran batting multiplier (runs * 1.2 * 1.3 = 1.56) with an exact fractional score', () => {
    // Batsman with 21 matches (> 20 -> +100), 101 runs, 2 wickets:
    // runs = 101 * 1.56 = 157.56
    // wickets = 2 * 20 = 40
    // experience = 100
    // total = 157.56 + 40 + 100 = 297.56
    expect(
      calculateImpactScore({
        role: 'Batsman',
        matchesPlayed: 21,
        totalRuns: 101,
        totalWickets: 2,
      }).total,
    ).toBe(297.56);
  });

  it('rejects negative statistics and invalid roles via validation', () => {
    expect(() =>
      calculateImpactScore({
        role: 'Bowler',
        matchesPlayed: 1,
        totalRuns: -1,
        totalWickets: 0,
      }),
    ).toThrow();

    expect(() =>
      calculateImpactScore(
        JSON.parse(
          '{"role":"InvalidRole","matchesPlayed":1,"totalRuns":1,"totalWickets":1}',
        ),
      ),
    ).toThrow();
  });
});

