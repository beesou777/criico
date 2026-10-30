'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';

export function TeamForm({ onCreated }: { onCreated?: () => void } = {}) {
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
      onCreated?.();
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
    <form
      autoComplete="off"
      className="team-create-form flex items-end gap-[18px] p-[2px_0_22px] border-b border-border max-sm:items-stretch max-sm:flex-col"
      onSubmit={submit}
    >
      <label className="flex-1 flex flex-col gap-[7px] text-foreground text-xs font-semibold">
        Team name
        <input
          autoComplete="new-password"
          className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
          name="teamName"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Kathmandu XI"
        />
      </label>
      <button
        type="submit"
        className="button button-primary inline-flex justify-center items-center gap-2 min-h-[46px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-xs cursor-pointer"
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <Check size={18} />
        )}{' '}
        {pending ? 'Creating…' : 'Create team'}
      </button>
    </form>
  );
}
