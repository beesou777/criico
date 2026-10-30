'use client';

import { useState, type FormEvent } from 'react';
import { Check, KeyRound, Save } from 'lucide-react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function AccountSettings({
  email,
  organizationName,
}: {
  email: string;
  organizationName: string;
}) {
  const [name, setName] = useState(organizationName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const body: Record<string, string> = { organizationName: name.trim() };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      await submitJSON('/api/account', 'PATCH', body);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Settings saved.');
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save settings.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 max-w-2xl">
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-soft text-accent">
            <Check size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Organization identity
            </h2>
            <p className="mt-1 text-xs text-secondary">
              This name appears across your clubhouse dashboard.
            </p>
          </div>
        </div>
        <label className="grid gap-2 text-xs font-semibold text-foreground">
          Organization name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
            className="min-h-11 px-3 py-2 border border-border rounded-md bg-card text-foreground"
          />
        </label>
        <p className="mt-2 text-xs text-secondary">Signed in as {email}</p>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-soft text-accent">
            <KeyRound size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Password</h2>
            <p className="mt-1 text-xs text-secondary">
              Set a new password for this organizer account.
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-2 text-xs font-semibold text-foreground">
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="min-h-11 px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold text-foreground">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Leave blank to keep your current password"
              className="min-h-11 px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="button button-primary inline-flex w-fit items-center gap-2 min-h-11 px-5 py-2 font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
      >
        <Save size={16} />
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
