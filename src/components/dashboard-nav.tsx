'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UsersRound,
  Trophy,
  NotebookPen,
  LogOut,
  LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { submitJSON } from '@/lib/client-api';
const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/players', label: 'Players', icon: UsersRound },
  { href: '/dashboard/matches', label: 'Matchbook', icon: NotebookPen },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];
export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="dashboard-nav" aria-label="Clubhouse navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/dashboard' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={active ? 'active' : ''}
          >
            <Icon size={19} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="logout-button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await submitJSON('/api/auth/logout', 'POST', {});
          window.location.assign('/login');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Could not sign out.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <LoaderCircle size={18} className="spin" />
      ) : (
        <LogOut size={18} />
      )}
      Sign out
    </button>
  );
}
