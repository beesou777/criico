'use client';

import { RotateCcw, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function TeamActions({
  teamId,
  teamName,
  disbanded,
}: {
  teamId: string;
  teamName: string;
  disbanded: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function updateTeam() {
    if (
      !disbanded &&
      !window.confirm(
        `Disband ${teamName}? Players and match history will be preserved.`,
      )
    ) {
      return;
    }
    setPending(true);
    try {
      await submitJSON(
        `/api/teams/${teamId}`,
        disbanded ? 'PATCH' : 'DELETE',
        {},
      );
      toast.success(
        disbanded ? `${teamName} restored.` : `${teamName} disbanded.`,
      );
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
    <button
      type="button"
      onClick={updateTeam}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 text-[10px] font-semibold text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
    >
      {disbanded ? <RotateCcw size={13} /> : <ShieldOff size={13} />}
      {pending ? 'Updating…' : disbanded ? 'Restore' : 'Disband'}
    </button>
  );
}
