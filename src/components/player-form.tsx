'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { roles, type Player, type Team } from '@/lib/contracts';
import { submitJSON } from '@/lib/client-api';

export function PlayerForm({
  player,
  teams = [],
}: {
  player?: Player;
  teams?: Team[];
}) {
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (!player) return;
    if (
      !window.confirm(
        `Are you sure you want to remove ${player.name} from the squad?`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await submitJSON(`/api/players/${player.id}`, 'DELETE', {});
      toast.success(`${player.name} removed from your squad.`);
      router.push('/dashboard/players');
      router.refresh();
    } catch (cause) {
      const text =
        cause instanceof Error ? cause.message : 'Could not delete player.';
      setError(text);
      toast.error(text);
    } finally {
      setDeleting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get('name') ?? '').trim(),
      role: String(form.get('role')),
      basePrice: Number(form.get('basePrice')),
      matchesPlayed: Number(form.get('matchesPlayed')),
      totalRuns: Number(form.get('totalRuns')),
      totalWickets: Number(form.get('totalWickets')),
      teamId: String(form.get('teamId') || ''),
    };
    const numberEntries = [
      values.basePrice,
      values.matchesPlayed,
      values.totalRuns,
      values.totalWickets,
    ];
    let message: string | null = null;
    if (values.totalRuns < 0) message = 'Total runs must be zero or greater.';
    else if (numberEntries.some((v) => !Number.isFinite(v) || v < 0))
      message = 'Prices and statistics must be zero or greater.';
    else if (
      [values.matchesPlayed, values.totalRuns, values.totalWickets].some(
        (v) => !Number.isInteger(v) || v > 10_000_000,
      )
    )
      message = 'Career statistics must be whole numbers up to 10,000,000.';
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    setPending(true);
    try {
      await submitJSON(
        player ? `/api/players/${player.id}` : '/api/players',
        player ? 'PUT' : 'POST',
        player ? { ...values, expectedUpdatedAt: player.updatedAt } : values,
      );
      toast.success(player ? 'Player updated.' : 'Player added to your squad.');
      router.push('/dashboard/players');
      router.refresh();
    } catch (cause) {
      const text =
        cause instanceof Error ? cause.message : 'Could not save player.';
      setError(text);
      toast.error(text);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="editor-form max-w-225 py-5">
      <fieldset
        className="bg-card border border-border rounded-lg p-[25px] mb-6 max-md:p-[20px_16px]"
        disabled={pending}
      >
        <legend className="text-[15px] font-bold text-foreground px-2">
          Player details
        </legend>
        <div className="form-grid grid grid-cols-2 gap-[22px] max-md:grid-cols-1 max-md:gap-5">
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Player name
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={player?.name}
              placeholder="Full name"
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Playing role
            <select
              name="role"
              defaultValue={player?.role ?? 'Batsman'}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Team
            <select
              name="teamId"
              required
              defaultValue={player?.teamId ?? ''}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Base price (NPR)
            <input
              name="basePrice"
              type="number"
              step="0.01"
              max={1000000000}
              required
              defaultValue={player?.basePrice ?? 0}
              onFocus={(event) => {
                if (event.currentTarget.value === '0')
                  event.currentTarget.select();
              }}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
        </div>
      </fieldset>
      <fieldset
        className="bg-card border border-border rounded-lg p-[25px] mb-6 max-md:p-[20px_16px]"
        disabled={pending}
      >
        <legend className="text-[15px] font-bold text-foreground px-2">
          Career statistics
        </legend>
        <p className="form-description text-secondary text-xs leading-[1.8] mb-6 max-w-[75ch]">
          {player
            ? 'These are career corrections. They do not change previously recorded match performances.'
            : 'Enter existing career totals, or start at zero. Future recorded matches add to these numbers.'}
        </p>
        <div className="form-grid three grid grid-cols-3 gap-[22px] max-md:grid-cols-1 max-md:gap-5">
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Matches played
            <input
              name="matchesPlayed"
              type="number"
              step="1"
              required
              defaultValue={player?.matchesPlayed ?? 0}
              onFocus={(event) => {
                if (event.currentTarget.value === '0')
                  event.currentTarget.select();
              }}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Total runs
            <input
              name="totalRuns"
              type="number"
              step="1"
              required
              defaultValue={player?.totalRuns ?? 0}
              onFocus={(event) => {
                if (event.currentTarget.value === '0')
                  event.currentTarget.select();
              }}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Total wickets
            <input
              name="totalWickets"
              type="number"
              step="1"
              required
              defaultValue={player?.totalWickets ?? 0}
              onFocus={(event) => {
                if (event.currentTarget.value === '0')
                  event.currentTarget.select();
              }}
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
        </div>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="notice error text-xs bg-[#fae8eb] border border-[#f1c3cb] p-[13px_16px] rounded-[4px] text-[#a01131] mb-5 font-semibold"
        >
          {error}
        </p>
      )}
      <div className="form-actions flex justify-end gap-[14px] mt-[25px] max-md:justify-between items-center">
        {player && (
          <button
            type="button"
            className="button button-danger inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] bg-[#a91230] text-white hover:bg-[#8f0f29] transition-colors text-xs cursor-pointer"
            disabled={pending || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Trash2 size={18} />
            )}
            {deleting ? 'Removing…' : 'Delete player'}
          </button>
        )}
        <Link
          className="button button-outline inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] bg-transparent hover:bg-soft transition-colors text-xs whitespace-nowrap"
          href="/dashboard/players"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="button button-primary inline-flex justify-center items-center gap-2 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] bg-accent text-white hover:bg-accent-hover transition-colors text-xs cursor-pointer whitespace-nowrap"
          disabled={pending || deleting}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" size={18} />
          ) : (
            <Check size={18} />
          )}
          {pending ? 'Saving…' : player ? 'Save changes' : 'Add to squad'}
        </button>
      </div>
    </form>
  );
}
