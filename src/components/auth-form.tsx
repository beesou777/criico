'use client';

import { useActionState, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { registerAction } from '@/app/actions';
import { submitJSON } from '@/lib/client-api';

export function AuthForm({
  mode,
  registered = false,
}: {
  mode: 'login' | 'register';
  registered?: boolean;
}) {
  const [state, action, registering] = useActionState(registerAction, {
    error: null,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const isRegister = mode === 'register';

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await submitJSON('/api/auth/login', 'POST', {
        email: form.get('email'),
        password: form.get('password'),
      });
      window.location.assign('/dashboard');
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Sign in failed.';
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  const busy = pending || registering;

  return (
    <>
      {registered && (
        <p
          className="notice success text-xs bg-[#eef5ea] border border-[#c2d6c6] p-[13px_16px] rounded-[4px] text-[#2b5420] font-semibold mb-5"
          role="status"
        >
          Your account is ready. Sign in to start your squad.
        </p>
      )}
      <form
        autoComplete="off"
        action={isRegister ? action : undefined}
        onSubmit={isRegister ? undefined : login}
        className="form-stack grid gap-5"
      >
        <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
          Password
          <div className="password-field relative">
            <input
              className="min-h-[46px] p-[12px_13px] pr-12 border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm w-full"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={72}
              placeholder={
                isRegister ? 'At least 8 characters' : 'Your password'
              }
            />
            <button
              type="button"
              className="absolute right-[3px] top-[3px] inline-flex items-center justify-center bg-transparent border-0 text-secondary w-10 h-10 rounded cursor-pointer hover:text-foreground transition-colors"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {isRegister && (
          <label className="flex flex-col gap-2 text-xs font-semibold text-foreground">
            Confirm password
            <input
              name="confirmPassword"
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              placeholder="Re-enter your password"
              className="min-h-[46px] p-[12px_13px] border border-[#b9c4b2] rounded-[4px] bg-white text-ink text-sm"
            />
          </label>
        )}
        {(error || state.error) && (
          <p
            className="notice error text-xs bg-[#fae8eb] border border-[#f1c3cb] p-[13px_16px] rounded-[4px] text-[#a01131] font-semibold"
            role="alert"
          >
            {error || state.error}
          </p>
        )}
        <button
          className="button button-primary inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-sm w-full cursor-pointer"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? (
            <>
              <LoaderCircle
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
              {isRegister ? 'Creating account…' : 'Signing in…'}
            </>
          ) : (
            <>
              {isRegister ? 'Create your account' : 'Enter the clubhouse'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <p className="auth-switch text-center text-xs mt-[25px] m-0 text-secondary">
        {isRegister ? 'Already have an account?' : 'New to the clubhouse?'}{' '}
        <Link
          className="text-primary font-bold underline hover:text-accent"
          href={isRegister ? '/login' : '/register'}
        >
          {isRegister ? 'Sign in' : 'Start your squad'}
        </Link>
      </p>
    </>
  );
}
