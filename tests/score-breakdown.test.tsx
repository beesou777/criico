import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScoreBreakdown } from '../src/components/score-breakdown';
import { calculateImpactScore, getExperienceStatus } from '../src/lib/score';
import type { RankedPlayer } from '../src/lib/contracts';

const player = (
  role: RankedPlayer['role'],
  matchesPlayed = 8,
): RankedPlayer => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Asha Batter',
  role,
  basePrice: 0,
  matchesPlayed,
  totalRuns: 100,
  totalWickets: 4,
  teamId: '00000000-0000-4000-8000-000000000002',
  teamName: 'Lions',
  updatedAt: '2026-10-29T10:00:00.000Z',
  score: calculateImpactScore({
    role,
    matchesPlayed,
    totalRuns: 100,
    totalWickets: 4,
  }),
  experienceStatus: getExperienceStatus(matchesPlayed),
});

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(
  dialogPrototype,
  'showModal',
);
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');

beforeEach(() => {
  Object.defineProperty(dialogPrototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(dialogPrototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
  if (originalShowModal) {
    Object.defineProperty(dialogPrototype, 'showModal', originalShowModal);
  } else {
    Reflect.deleteProperty(dialogPrototype, 'showModal');
  }
  if (originalClose) {
    Object.defineProperty(dialogPrototype, 'close', originalClose);
  } else {
    Reflect.deleteProperty(dialogPrototype, 'close');
  }
  vi.unstubAllGlobals();
});

describe('ScoreBreakdown dialog', () => {
  it('opens the score calculation in a dialog without changing the table row content', () => {
    render(<ScoreBreakdown player={player('Batsman')} />);
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));

    expect(screen.getByRole('dialog', { name: 'Asha Batter' })).toBeVisible();
    expect(screen.getByText('Runs contribution')).toBeInTheDocument();
    expect(screen.getByText('Wickets contribution')).toBeInTheDocument();
    expect(screen.getByText('Batsman role bonus')).toBeInTheDocument();
    expect(screen.getByText('Experience adjustment')).toBeInTheDocument();
    expect(screen.getByText('Final Impact Score')).toBeInTheDocument();
  });

  it('closes with the close control and returns focus to its trigger', () => {
    render(<ScoreBreakdown player={player('Bowler')} />);
    const trigger = screen.getByRole('button', {
      name: /view profile/i,
    });
    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole('button', { name: 'Close player profile' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves keyboard focus into the dialog when it opens', () => {
    render(<ScoreBreakdown player={player('All-rounder')} />);
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));

    expect(
      screen.getByRole('button', { name: 'Close player profile' }),
    ).toHaveFocus();
  });

  it('closes when Escape is pressed', () => {
    render(<ScoreBreakdown player={player('All-rounder')} />);
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: false, cancelable: true }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the dialog backdrop is clicked', () => {
    render(<ScoreBreakdown player={player('Wicketkeeper')} />);
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));
    fireEvent.click(screen.getByRole('dialog'), { clientX: 20, clientY: 20 });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
