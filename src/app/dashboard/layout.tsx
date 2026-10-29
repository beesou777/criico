import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { DashboardNav, LogoutButton } from '@/components/dashboard-nav';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!session) redirect('/login');
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Brand light />
        <p className="sidebar-label">YOUR CLUBHOUSE</p>
        <DashboardNav />
        <div className="sidebar-bottom">
          <p>
            Cricket. Community.
            <br />
            Together.
          </p>
          <LogoutButton />
        </div>
      </aside>
      <div className="dashboard-body">
        <header className="dashboard-topbar">
          <span>Grassroots Cricket Manager</span>
          <div>
            <span className="session-dot" />{' '}
            <span className="account-email">{session.email}</span>
          </div>
        </header>
        <main id="main" className="dashboard-main">
          {children}
        </main>
        <footer className="dashboard-footer">
          Your local game, properly managed.<span>CRIICO / NEPAL</span>
        </footer>
      </div>
    </div>
  );
}
