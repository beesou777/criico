import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { DashboardNav, LogoutButton } from '@/components/dashboard-nav';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { getAccount } from '@/lib/services/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!session) redirect('/login');
  const account = await getAccount(session.id);
  if (!account) redirect('/login');

  return (
    <div className="dashboard-shell flex min-h-dvh max-md:flex-col">
      <aside className="sidebar w-[228px] shrink-0 bg-sidebar p-[34px_24px_24px] flex flex-col text-paper sticky top-0 h-dvh max-lg:w-[190px] max-lg:p-[30px_16px] max-md:w-full max-md:h-auto max-md:relative max-md:p-[19px_5%_0]">
        <Brand
          light
          className="p-[0_8px] text-[30px] max-md:p-0 max-md:text-[26px]"
        />
        <DashboardNav />
        <div className="sidebar-bottom mt-auto pt-7.5 max-md:absolute max-md:top-4.25 max-md:right-[5%] max-md:p-0">
          <LogoutButton />
        </div>
      </aside>
      <div className="dashboard-body flex-1 min-w-0 flex flex-col">
        <header className="dashboard-topbar flex justify-between gap-5 items-center min-h-[78px] p-[20px_4%] border-b border-border text-[11px] text-secondary max-md:min-h-13 max-md:p-[14px_5%] max-md:text-[9px]">
          <span>{account.organizationName}</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="session-dot w-1.5 h-1.5 bg-[#397448] rounded-full shrink-0" />{' '}
            <span className="account-email overflow-hidden text-ellipsis whitespace-nowrap max-w-60 max-lg:max-w-42.5 max-md:max-w-40">
              {session.email}
            </span>
          </div>
        </header>
        <main
          id="main"
          className="dashboard-main p-[38px_4%_55px] flex-1 max-md:p-[28px_5%_40px]"
        >
          {children}
        </main>
        <footer className="dashboard-footer flex justify-between gap-4 p-[24px_4%] text-[11px] text-secondary border-t border-border max-md:p-[20px_5%] max-md:text-[9px]">
          Your local game, properly managed.
          <span className="tracking-[0.12em] text-[9px] max-md:text-[8px]">
            CRIICO / NEPAL
          </span>
        </footer>
      </div>
    </div>
  );
}
