'use client';

import { MoreHorizontal, RotateCcw, ShieldOff, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'edit' | 'disband' | null>(null);
  const [name, setName] = useState(teamName);
  const [pending, setPending] = useState(false);

  async function submit(action: 'edit' | 'disband' | 'restore') {
    setPending(true);
    try {
      if (action === 'edit')
        await submitJSON(`/api/teams/${teamId}`, 'PUT', { name: name.trim() });
      else
        await submitJSON(
          `/api/teams/${teamId}`,
          action === 'restore' ? 'PATCH' : 'DELETE',
          {},
        );
      toast.success(
        action === 'edit'
          ? 'Team name updated.'
          : action === 'restore'
            ? `${teamName} restored.`
            : `${teamName} disbanded.`,
      );
      setDialog(null);
      setMenuOpen(false);
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
    <div className="relative inline-flex justify-end">
      <button
        type="button"
        aria-label={`Actions for ${teamName}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
        className="grid h-8 w-8 place-items-center rounded-md text-secondary hover:bg-soft hover:text-foreground"
      >
        <MoreHorizontal size={18} />
      </button>
      {menuOpen && (
        <div className="absolute bottom-9 right-0 z-20 min-w-36 rounded-lg border border-border bg-card p-1.5 text-left shadow-lg">
          {!disbanded && (
            <button
              type="button"
              onClick={() => {
                setDialog('edit');
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs text-foreground hover:bg-soft"
            >
              Edit team name
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setDialog('disband');
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs text-foreground hover:bg-soft"
          >
            {disbanded ? <RotateCcw size={14} /> : <ShieldOff size={14} />}
            {disbanded ? 'Restore team' : 'Disband team'}
          </button>
        </div>
      )}
      {dialog && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#24151a]/45 p-4"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDialog(null)
          }
        >
          <section
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-left shadow-2xl"
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
                  {dialog === 'edit'
                    ? 'Edit team name'
                    : disbanded
                      ? 'Restore this team?'
                      : 'Disband this team?'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-md p-1 text-secondary hover:bg-soft hover:text-foreground"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            {dialog === 'edit' ? (
              <label className="mt-5 block text-xs font-semibold text-foreground">
                Team name
                <input
                  autoComplete="off"
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-secondary">
                {disbanded
                  ? `Are you sure you want to restore ${teamName}?`
                  : `Are you sure you want to disband ${teamName}?`}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-secondary hover:bg-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  submit(
                    dialog === 'edit'
                      ? 'edit'
                      : disbanded
                        ? 'restore'
                        : 'disband',
                  )
                }
                disabled={
                  pending || (dialog === 'edit' && name.trim().length < 2)
                }
                className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                {pending
                  ? 'Working...'
                  : dialog === 'edit'
                    ? 'Save changes'
                    : disbanded
                      ? 'Restore team'
                      : 'Disband team'}
              </button>
            </div>
          </section>
        </div>
      )}
      <span className="sr-only">
        {playerCount} {playerCount === 1 ? 'player' : 'players'}
      </span>
    </div>
  );
}
