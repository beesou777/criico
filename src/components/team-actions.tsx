'use client';

import { RotateCcw, ShieldOff, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function TeamActions({
  teamId,
  teamName,
  playerCount,
  disbanded,
}: {
  teamId: string;
  teamName: string;
  playerCount: number;
  disbanded: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const permanentDelete = !disbanded && playerCount === 0;

  async function updateTeam() {
    setPending(true);
    try {
      await submitJSON(
        `/api/teams/${teamId}`,
        disbanded ? 'PATCH' : 'DELETE',
        {},
      );
      toast.success(
        disbanded
          ? `${teamName} restored.`
          : permanentDelete
            ? `${teamName} deleted.`
            : `${teamName} disbanded.`,
      );
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update team.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (disbanded ? updateTeam() : setOpen(true))}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 text-[10px] font-semibold text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
      >
        {disbanded ? (
          <RotateCcw size={13} />
        ) : permanentDelete ? (
          <Trash2 size={13} />
        ) : (
          <ShieldOff size={13} />
        )}
        {pending
          ? 'Updating...'
          : disbanded
            ? 'Restore'
            : permanentDelete
              ? 'Delete'
              : 'Disband'}
      </button>
      {!disbanded && open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#24151a]/45 p-4"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <section
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-dialog-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                  Team management
                </p>
                <h2
                  id="team-dialog-title"
                  className="mt-1 text-lg font-bold text-foreground"
                >
                  {permanentDelete
                    ? 'Delete team permanently?'
                    : 'Disband this team?'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-secondary hover:bg-soft hover:text-foreground"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              {permanentDelete
                ? `${teamName} has no players and can be removed permanently. This cannot be undone.`
                : `${teamName} has players or records. Disbanding hides it from active workflows while preserving its roster and match history.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-secondary hover:bg-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateTeam}
                disabled={pending}
                className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                {pending
                  ? 'Working...'
                  : permanentDelete
                    ? 'Delete team'
                    : 'Disband team'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
