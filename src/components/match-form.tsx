'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Player } from '@/lib/contracts';
import { submitJSON } from '@/lib/client-api';
export function MatchForm({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const router = useRouter();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const performances = selected.map((id) => ({
      playerId: id,
      teamSide: String(form.get(`side-${id}`)),
      runs: Number(form.get(`runs-${id}`)),
      wickets: Number(form.get(`wickets-${id}`)),
    }));
    if (!performances.length) {
      toast.error('Select at least one participating player.');
      setError('Select at least one participating player.');
      return;
    }
    if (
      performances.some(
        (p) =>
          !Number.isInteger(p.runs) ||
          !Number.isInteger(p.wickets) ||
          p.runs < 0 ||
          p.wickets < 0 ||
          p.runs > 10_000_000 ||
          p.wickets > 10_000_000,
      )
    ) {
      toast.error(
        'Runs and wickets must be whole numbers from 0 to 10,000,000.',
      );
      setError('Check the player performances.');
      return;
    }
    const key = submissionKey ?? crypto.randomUUID();
    setSubmissionKey(key);
    setPending(true);
    try {
      await submitJSON('/api/matches', 'POST', {
        teamA: String(form.get('teamA')).trim(),
        teamB: String(form.get('teamB')).trim(),
        result: String(form.get('result')),
        playedAt: String(form.get('playedAt')),
        submissionKey: key,
        performances,
      });
      toast.success(
        'Match recorded. Career statistics and leaderboard updated.',
      );
      router.push('/dashboard/matches');
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not record match.';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="editor-form"
      onSubmit={submit}
      onChange={() => {
        if (!pending) setSubmissionKey(null);
      }}
    >
      <fieldset disabled={pending}>
        <legend>Match details</legend>
        <div className="form-grid">
          <label>
            Team A
            <input
              name="teamA"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Kathmandu XI"
            />
          </label>
          <label>
            Team B
            <input
              name="teamB"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Lalitpur CC"
            />
          </label>
          <label>
            Match date
            <input
              type="date"
              name="playedAt"
              required
              defaultValue={today}
              max={today}
            />
          </label>
          <label>
            Result
            <select name="result">
              <option value="A">Team A won</option>
              <option value="B">Team B won</option>
              <option value="TIE">Match tied</option>
              <option value="NO_RESULT">No result</option>
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend>Player performances</legend>
        <p className="form-description">
          Select the players who participated, then enter their match figures.
          Each selected player gains one career match, even with zero runs and
          wickets. A / B refers to the teams above.
        </p>
        <div className="performance-list">
          {players.map((player) => {
            const checked = selected.includes(player.id);
            return (
              <div
                key={player.id}
                className={`performance-row${checked ? ' selected' : ''}`}
              >
                <label className="participant">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, player.id]
                          : selected.filter((id) => id !== player.id),
                      )
                    }
                  />
                  <span>
                    {player.name}
                    <small>{player.role}</small>
                  </span>
                </label>
                {checked && (
                  <div className="performance-inputs">
                    <label>
                      Team
                      <select name={`side-${player.id}`}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </label>
                    <label>
                      Runs
                      <input
                        type="number"
                        name={`runs-${player.id}`}
                        required
                        step="1"
                        defaultValue={0}
                      />
                    </label>
                    <label>
                      Wickets
                      <input
                        type="number"
                        name={`wickets-${player.id}`}
                        required
                        step="1"
                        defaultValue={0}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
      <p className="notice">
        Saving records this result and updates career totals together. Recorded
        matches cannot be edited in this version.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Link href="/dashboard/matches" className="button button-outline">
          Cancel
        </Link>
        <button disabled={pending} className="button button-primary">
          {pending ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <Check size={18} />
          )}
          {pending ? 'Recording…' : 'Record match'}
        </button>
      </div>
    </form>
  );
}
