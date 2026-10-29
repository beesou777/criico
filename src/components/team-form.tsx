'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function TeamForm() {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await submitJSON('/api/teams', 'POST', {
        name: String(form.get('name') ?? '').trim(),
      });
      toast.success('Team created.');
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create team.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="team-create-form" onSubmit={submit}>
      <label>
        Team name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Kathmandu XI"
        />
      </label>
      <button className="button button-primary" disabled={pending}>
        {pending ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <Check size={18} />
        )}{' '}
        {pending ? 'Creating…' : 'Create team'}
      </button>
    </form>
  );
}
