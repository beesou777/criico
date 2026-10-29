'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { roles, type Player } from '@/lib/contracts';
import { submitJSON } from '@/lib/client-api';
export function PlayerForm({ player }: { player?: Player }) {
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (!player) return;
    if (!window.confirm(`Are you sure you want to remove ${player.name} from the squad?`)) {
      return;
    }
    setDeleting(true);
    try {
      await submitJSON(`/api/players/${player.id}`, 'DELETE', {});
      toast.success(`${player.name} removed from your squad.`);
      router.push('/dashboard/players');
      router.refresh();
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : 'Could not delete player.';
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
    <form onSubmit={submit} className="editor-form">
      <fieldset disabled={pending}>
        <legend>Player details</legend>
        <div className="form-grid">
          <label>
            Player name
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={player?.name}
              placeholder="Full name"
            />
          </label>
          <label>
            Playing role
            <select name="role" defaultValue={player?.role ?? 'Batsman'}>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Base price (NPR)
            <input
              name="basePrice"
              type="number"
              step="0.01"
              max={1000000000}
              required
              defaultValue={player?.basePrice ?? 0}
            />
          </label>
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend>Career statistics</legend>
        <p className="form-description">
          {player
            ? 'These are career corrections. They do not change previously recorded match performances.'
            : 'Enter existing career totals, or start at zero. Future recorded matches add to these numbers.'}
        </p>
        <div className="form-grid three">
          <label>
            Matches played
            <input
              name="matchesPlayed"
              type="number"
              step="1"
              required
              defaultValue={player?.matchesPlayed ?? 0}
            />
          </label>
          <label>
            Total runs
            <input
              name="totalRuns"
              type="number"
              step="1"
              required
              defaultValue={player?.totalRuns ?? 0}
            />
          </label>
          <label>
            Total wickets
            <input
              name="totalWickets"
              type="number"
              step="1"
              required
              defaultValue={player?.totalWickets ?? 0}
            />
          </label>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="form-actions">
        {player && (
          <button
            type="button"
            className="button button-danger"
            disabled={pending || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <Trash2 size={18} />
            )}
            {deleting ? 'Removing…' : 'Delete player'}
          </button>
        )}
        <Link className="button button-outline" href="/dashboard/players">
          Cancel
        </Link>
        <button className="button button-primary" disabled={pending || deleting}>
          {pending ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Check size={18} />
          )}
          {pending ? 'Saving…' : player ? 'Save changes' : 'Add to squad'}
        </button>
      </div>
    </form>
  );
}
