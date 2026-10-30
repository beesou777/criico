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
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="dashboard-nav grid gap-[7px] max-md:flex max-md:gap-[5px] max-md:mt-5 max-md:overflow-x-auto max-md:pb-3"
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
              'flex items-center gap-[13px] p-[13px_12px] rounded-[5px] text-xs font-medium text-[#f2d6de] hover:bg-white/5 hover:text-white transition-colors max-md:p-[10px_12px] max-md:text-[10px] max-md:gap-[7px] max-md:whitespace-nowrap',
              active ? 'bg-accent text-white font-bold' : '',
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
      className="logout-button flex items-center gap-3 bg-transparent border-0 text-[#f2d6de] text-xs p-[14px_12px] w-full text-left border-t border-[#8d475b] cursor-pointer hover:text-white hover:bg-white/5 transition-colors max-md:border-0 max-md:p-[5px] max-md:text-[10px] max-md:gap-[7px]"
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
