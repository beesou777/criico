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
        <p className="notice success" role="status">
          Your account is ready. Sign in to start your squad.
        </p>
      )}
      <form
        action={isRegister ? action : undefined}
        onSubmit={isRegister ? undefined : login}
        className="form-stack"
      >
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={10}
              maxLength={72}
              placeholder={
                isRegister ? 'At least 10 characters' : 'Your password'
              }
            />
            <button
              type="button"
              className="icon-button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {isRegister && (
          <label>
            Confirm password
            <input
              name="confirmPassword"
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={72}
              placeholder="Re-enter your password"
            />
          </label>
        )}
        {(error || state.error) && (
          <p className="notice error" role="alert">
            {error || state.error}
          </p>
        )}
        <button
          className="button button-primary full-width"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={18} aria-hidden="true" />
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
      <p className="auth-switch">
        {isRegister ? 'Already have an account?' : 'New to the clubhouse?'}{' '}
        <Link href={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Sign in' : 'Start your squad'}
        </Link>
      </p>
    </>
  );
}
