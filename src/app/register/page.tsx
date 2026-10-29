import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm } from '@/components/auth-form';
import { getSessionUser } from '@/lib/session';

export const metadata = { title: 'Start your squad' };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthShell
      title="Open your clubhouse."
      description="Create an organizer account. Build rosters, record matches, and follow your players."
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
