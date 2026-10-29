'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { RankedPlayer } from '@/lib/contracts';
import { numberFormat } from '@/lib/contracts';

export function ScoreBreakdown({
  player,
  showScore = true,
}: {
  player: RankedPlayer;
  showScore?: boolean;
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

    function positionDialog() {
      const trigger = triggerRef.current;
      if (!trigger || !dialog) return;
      const viewport = window.matchMedia('(max-width: 640px)').matches;
      if (viewport) return;

      const anchor = trigger.getBoundingClientRect();
      const panel = dialog.getBoundingClientRect();
      const left = Math.min(
        Math.max(12, anchor.right - panel.width),
        window.innerWidth - panel.width - 12,
      );
      let top = anchor.top - panel.height - 8;
      if (top < 12)
        top = Math.min(
          anchor.bottom + 8,
          window.innerHeight - panel.height - 12,
        );
      dialog.style.setProperty('--score-popover-left', `${left}px`);
      dialog.style.setProperty('--score-popover-top', `${top}px`);
    }

    positionDialog();
    window.addEventListener('resize', positionDialog);
    return () => window.removeEventListener('resize', positionDialog);
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
      <button
        ref={triggerRef}
        type="button"
        className="score-hint score-breakdown-trigger"
        aria-label={`View score breakdown for ${player.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
      >
        View breakdown
      </button>
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
            <h2 id={`${dialogId}-title`}>Impact Score</h2>
            <p>{player.name}</p>
          </div>
          <button
            type="button"
            className="score-popover-close"
            aria-label="Close score breakdown"
            autoFocus
            onClick={closeDialog}
          >
            <X size={17} />
          </button>
        </div>
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
    </div>
  );
}
