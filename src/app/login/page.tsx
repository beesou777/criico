import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm } from '@/components/auth-form';
import { getSessionUser } from '@/lib/session';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  return (
    <AuthShell
      title="Welcome to the clubhouse."
      description="Sign in to pick up where your squad left off."
    >
      <AuthForm mode="login" registered={params.registered === '1'} />
    </AuthShell>
  );
}
