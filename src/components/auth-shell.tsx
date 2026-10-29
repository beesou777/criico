import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Brand } from './brand';

export function AuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main
      id="main"
      className="auth-shell grid grid-cols-[42%_58%] min-h-dvh max-md:block"
    >
      <section className="auth-story bg-[#501326] text-paper flex flex-col justify-between p-[40px_11%] min-h-full max-md:min-h-0 max-md:p-[25px_7%]">
        <Brand light />
        <div className="max-md:hidden">
          <span
            className="auth-stumps flex gap-[18px] h-[100px] border-t-4 border-[#d7dccb] w-fit pt-[5px]"
            aria-hidden="true"
          >
            <i className="block w-[7px] h-[90px] bg-[#d7dccb] not-italic" />
            <i className="block w-[7px] h-[90px] bg-[#d7dccb] not-italic" />
            <i className="block w-[7px] h-[90px] bg-[#d7dccb] not-italic" />
          </span>
          <h2 className="text-[clamp(32px,3.8vw,56px)] leading-[1.2] tracking-[-0.04em] font-extrabold mt-7 text-paper">
            Your ground.
            <br />
            Your players.
            <br />
            Your clubhouse.
          </h2>
          <p className="text-[#f1ced8] text-sm mt-[22px] leading-[1.8]">
            Good cricket starts with a community.
            <br />
            Give yours a place to grow.
          </p>
        </div>
        <p className="auth-tagline text-xs text-[#f1ced8] mt-[30px] max-md:hidden">
          Cricket. Community. Together.
        </p>
      </section>
      <section className="auth-content p-[40px_9%_24px] flex flex-col justify-between max-md:p-[25px_7%] max-md:min-h-[calc(100dvh-84px)]">
        <Link
          className="back-link inline-flex items-center gap-[9px] text-xs w-fit text-foreground hover:text-accent transition-colors"
          href="/"
        >
          <ArrowLeft size={16} />
          Back to the ground
        </Link>
        <div className="auth-panel w-full max-w-[430px] m-[45px_auto] max-md:m-[36px_auto]">
          <h1 className="text-[32px] font-extrabold leading-[1.25] tracking-[-0.035em] mb-[14px] text-foreground max-md:text-[29px]">
            {title}
          </h1>
          <p className="text-secondary mb-[30px] text-sm leading-normal">
            {description}
          </p>
          {children}
        </div>
        <p className="auth-bottom text-center text-[10px] uppercase tracking-[0.12em] text-secondary">
          Grassroots cricket, Nepal
        </p>
      </section>
    </main>
  );
}
