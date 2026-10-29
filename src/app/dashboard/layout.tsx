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
    <div className="dashboard-shell flex min-h-dvh max-md:flex-col">
      <aside className="sidebar w-[228px] shrink-0 bg-[#501326] p-[34px_24px_24px] flex flex-col text-paper sticky top-0 h-dvh max-lg:w-[190px] max-lg:p-[30px_16px] max-md:w-full max-md:h-auto max-md:relative max-md:p-[19px_5%_0]">
        <Brand light className="p-[0_8px] text-[30px] max-md:p-0 max-md:text-[26px]" />
        <p className="sidebar-label text-[9px] text-[#e9bcc8] tracking-[0.16em] m-[50px_12px_15px] uppercase font-semibold max-md:hidden">
          YOUR CLUBHOUSE
        </p>
        <DashboardNav />
        <div className="sidebar-bottom mt-auto pt-[30px] max-md:absolute max-md:top-[17px] max-md:right-[5%] max-md:p-0">
          <p className="text-[17px] leading-[1.5] font-bold text-[#f2d6de] p-[0_12px_25px] max-md:hidden">
            Cricket. Community.
            <br />
            Together.
          </p>
          <LogoutButton />
        </div>
      </aside>
      <div className="dashboard-body flex-1 min-w-0 flex flex-col">
        <header className="dashboard-topbar flex justify-between gap-5 items-center min-h-[78px] p-[20px_4%] border-b border-border text-[11px] text-secondary max-md:min-h-[52px] max-md:p-[14px_5%] max-md:text-[9px]">
          <span>Grassroots Cricket Manager</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="session-dot w-1.5 h-1.5 bg-[#397448] rounded-full shrink-0" />{' '}
            <span className="account-email overflow-hidden text-ellipsis whitespace-nowrap max-w-[240px] max-lg:max-w-[170px] max-md:max-w-[160px]">
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
