'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { RankedPlayer } from '@/lib/contracts';
import { numberFormat } from '@/lib/contracts';

export function ScoreBreakdown({
  player,
  showScore = true,
  showTrigger = true,
}: {
  player: RankedPlayer;
  showScore?: boolean;
  showTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = `score-breakdown-${player.id}`;
  const score = player.score;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || dialog.open) return;

    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[autofocus]')?.focus();
  }, [open]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    else setOpen(false);
  }

  function closeOnBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) closeDialog();
  }

  return (
    <div className="score-breakdown-control">
      {showScore && (
        <span className="score-value">{numberFormat.format(score.total)}</span>
      )}
      {showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          className="score-hint score-breakdown-trigger"
          aria-label={`View profile for ${player.name}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => setOpen(true)}
        >
          View profile
        </button>
      )}
      {showTrigger && (
        <dialog
          ref={dialogRef}
          id={dialogId}
          className="score-popover"
          aria-labelledby={`${dialogId}-title`}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
          onClick={closeOnBackdrop}
        >
          <div className="score-popover-heading">
            <div>
              <p className="player-profile-kicker">Player profile</p>
              <h2 id={`${dialogId}-title`}>{player.name}</h2>
              <p>
                {player.teamName} · {player.role}
              </p>
            </div>
            <button
              type="button"
              className="score-popover-close"
              aria-label="Close player profile"
              autoFocus
              onClick={closeDialog}
            >
              <X size={17} />
            </button>
          </div>
          <dl className="player-profile-details">
            <div>
              <dt>Team</dt>
              <dd>{player.teamName}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{player.role}</dd>
            </div>
            <div>
              <dt>Base price</dt>
              <dd>{numberFormat.format(player.basePrice)}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{player.experienceStatus}</dd>
            </div>
            <div>
              <dt>Matches played</dt>
              <dd>{numberFormat.format(player.matchesPlayed)}</dd>
            </div>
            <div>
              <dt>Total runs</dt>
              <dd>{numberFormat.format(player.totalRuns)}</dd>
            </div>
            <div>
              <dt>Total wickets</dt>
              <dd>{numberFormat.format(player.totalWickets)}</dd>
            </div>
          </dl>
          <h3 className="score-breakdown-section-title">Impact calculation</h3>
          <dl className="score-breakdown-list">
            <div>
              <dt>Runs contribution</dt>
              <dd>{numberFormat.format(score.runs)}</dd>
            </div>
            <div>
              <dt>Wickets contribution</dt>
              <dd>{numberFormat.format(score.wickets)}</dd>
            </div>
            {score.roleBonus > 0 && (
              <div>
                <dt>
                  {player.role === 'Batsman'
                    ? 'Batsman role bonus'
                    : 'Bowler role bonus'}
                </dt>
                <dd>{numberFormat.format(score.roleBonus)}</dd>
              </div>
            )}
            {player.role === 'Wicketkeeper' && (
              <div>
                <dt>Wicketkeeper bonus</dt>
                <dd>{numberFormat.format(score.keeper)}</dd>
              </div>
            )}
            <div>
              <dt>
                {player.matchesPlayed < 5
                  ? 'Rookie adjustment'
                  : player.matchesPlayed > 20
                    ? 'Veteran bonus'
                    : 'Experience adjustment'}
              </dt>
              <dd>{numberFormat.format(score.experience)}</dd>
            </div>
            <div className="score-breakdown-total">
              <dt>Final Impact Score</dt>
              <dd>{numberFormat.format(score.total)}</dd>
            </div>
          </dl>
        </dialog>
      )}
    </div>
  );
}
