'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function TeamForm() {
  const [pending, setPending] = useState(false);
  const [name, setName] = useState('');
  const submitting = useRef(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      toast.error('Team name must have at least 2 non-space characters.');
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      await submitJSON('/api/teams', 'POST', {
        name: normalizedName,
      });
      toast.success('Team created.');
      setName('');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create team.',
      );
    } finally {
      submitting.current = false;
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
          value={name}
          onChange={(event) => setName(event.target.value)}
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
