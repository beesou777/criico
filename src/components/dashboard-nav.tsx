'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UsersRound,
  Shield,
  Trophy,
  NotebookPen,
  LogOut,
  LoaderCircle,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { submitJSON } from '@/lib/client-api';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/players', label: 'Players', icon: UsersRound },
  { href: '/dashboard/teams', label: 'Teams', icon: Shield },
  { href: '/dashboard/matches', label: 'Matchbook', icon: NotebookPen },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="dashboard-nav mt-8 grid gap-1.5 max-md:mt-5 max-md:flex max-md:gap-1.5 max-md:overflow-x-auto max-md:pb-3"
      aria-label="Clubhouse navigation"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/dashboard' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex min-h-11 items-center gap-3 rounded-md px-3 text-xs font-medium text-sidebar-text transition-colors hover:bg-white/10 hover:text-white max-md:min-h-9 max-md:px-2.5 max-md:text-[10px] max-md:gap-2 max-md:whitespace-nowrap',
              active ? 'bg-accent font-bold text-white shadow-sm' : '',
            )}
          >
            <Icon className="w-[19px] h-[19px] max-md:w-4 max-md:h-4 shrink-0" />
            <span>{label}</span>
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
      className="logout-button flex min-h-11 w-full items-center gap-3 border-0 bg-transparent px-3 text-left text-xs text-sidebar-text transition-colors hover:bg-white/10 hover:text-white max-md:min-h-9 max-md:px-2.5 max-md:text-[10px] max-md:gap-2"
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
        <LoaderCircle size={18} className="animate-spin shrink-0" />
      ) : (
        <LogOut size={18} className="shrink-0" />
      )}
      Sign out
    </button>
  );
}
