import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { getSessionUser } from '@/lib/session';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <>
      <header className="site-header h-[88px] flex items-center justify-between gap-[30px] px-[4%] border-b border-[#bec7b9] max-md:px-[6%] max-md:h-[75px] max-md:gap-[10px]">
        <Brand />
        <nav className="flex items-center gap-[30px] ml-auto max-md:hidden" aria-label="Main navigation">
          <a className="text-[13px] font-semibold text-foreground hover:text-accent transition-colors" href="#clubhouse">
            The clubhouse
          </a>
          <a className="text-[13px] font-semibold text-foreground hover:text-accent transition-colors" href="#how-it-works">
            How it works
          </a>
          <a className="text-[13px] font-semibold text-foreground hover:text-accent transition-colors" href="#features">
            Features
          </a>
          {user && (
            <Link className="text-[13px] font-semibold text-foreground hover:text-accent transition-colors" href="/dashboard">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="header-actions flex items-center gap-[26px] max-md:gap-[15px]">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="signin-link text-[13px] font-semibold text-foreground hover:text-accent pl-[26px] border-l border-[#aab5a4] transition-colors max-md:pl-0 max-md:border-l-0 max-md:text-[11px]"
              >
                Clubhouse
              </Link>
              <Link
                href="/dashboard"
                className="button button-primary inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-sm max-md:min-h-[40px] max-md:gap-2 max-md:p-[10px_12px] max-md:text-[10px]"
              >
                Dashboard <ArrowRight size={18} className="max-md:hidden shrink-0" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="signin-link text-[13px] font-semibold text-foreground hover:text-accent pl-[26px] border-l border-[#aab5a4] transition-colors max-md:pl-0 max-md:border-l-0 max-md:text-[11px]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="button button-primary inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-sm max-md:min-h-[40px] max-md:gap-2 max-md:p-[10px_12px] max-md:text-[10px]"
              >
                Start your squad <ArrowRight size={18} className="max-md:hidden shrink-0" />
              </Link>
            </>
          )}
        </div>
      </header>
      <main id="main">
        <section
          className="hero grid grid-cols-[50%_50%] min-h-[570px] overflow-hidden max-md:flex max-md:flex-col"
          id="clubhouse"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy p-[75px_0_38px_8%] z-[2] relative max-md:p-[46px_6%_30px]">
            <h1
              className="text-[clamp(40px,4.35vw,76px)] leading-[1.12] font-extrabold tracking-[-0.04em] text-foreground max-md:text-[clamp(30px,6.5vw,48px)]"
              id="hero-title"
            >
              Every player.
              <br />
              Every match.
              <br />
              <span className="whitespace-nowrap">Every bit of impact.</span>
            </h1>
            <p className="text-[clamp(16px,1.4vw,21px)] leading-[1.65] max-w-[490px] pr-[30px] mt-[25px] text-foreground max-md:text-[15px] max-md:max-w-[42ch] max-md:mt-[22px] max-md:pr-0">
              Build your roster, record the match, and give every performance
              its place on the board.
            </p>
            <div className="hero-actions flex gap-4 mt-[28px] max-md:mt-[25px]">
              {user ? (
                <Link
                  href="/dashboard"
                  className="button button-primary inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-sm max-md:text-xs max-md:min-h-[46px]"
                >
                  Go to Dashboard <ArrowRight size={19} />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="button button-primary inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-transparent rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-accent text-white hover:bg-accent-hover text-sm max-md:text-xs max-md:min-h-[46px]"
                >
                  Start your squad <ArrowRight size={19} />
                </Link>
              )}
              <a
                href="#how-it-works"
                className="button button-outline inline-flex justify-center items-center gap-4 min-h-[47px] p-[12px_22px] font-semibold border border-[#b23855] text-[#9b1836] rounded-[4px] leading-[1.4] transition-colors duration-200 whitespace-nowrap bg-transparent hover:bg-soft text-sm max-md:text-xs max-md:min-h-[46px]"
              >
                How it works
              </a>
            </div>
            <div className="hero-footnote flex items-center gap-2.5 text-[11px] text-secondary mt-[36px] max-md:mt-[23px] max-md:text-[10px]">
              <span
                className="small-wicket w-[14px] h-[14px] border-l-2 border-r-2 border-[#66845c] relative after:content-[''] after:absolute after:h-[14px] after:w-[2px] after:left-[4px] after:bg-[#66845c]"
                aria-hidden="true"
              />
              Made for the local game. Built around your players.
            </div>
          </div>
          <div className="hero-field relative min-h-[570px] isolate before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-[12%] before:z-[1] before:bg-gradient-to-r before:from-paper before:to-transparent max-md:min-h-[330px] max-md:before:hidden">
            <Image
              src="/images/cricket-ground.png"
              alt="Illustrated aerial view of a tree-lined cricket ground with players at the crease"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 52vw"
              className="ground-image object-cover object-center max-md:object-center"
            />
            <svg
              className="delivery-path absolute inset-0 w-full h-full z-[2] pointer-events-none fill-none max-md:hidden"
              viewBox="0 0 600 600"
              aria-hidden="true"
            >
              <path
                className="trajectory fill-none stroke-[#fff9e9] stroke-2 [stroke-dasharray:5_7]"
                d="M290 390 Q345 205 485 320"
              />
              <g className="delivery-ball">
                <animateMotion
                  dur="1.8s"
                  begin="0s"
                  repeatCount="2"
                  fill="freeze"
                  path="M290 390 Q345 205 485 320"
                />
                <circle r="8" fill="#DC143C" />
                <path
                  d="M-2 -7 L2 7"
                  fill="none"
                  stroke="#fff9e9"
                  strokeWidth="1.4"
                  strokeDasharray="1.5 1.5"
                />
              </g>
            </svg>
            <div className="field-caption absolute bottom-[18px] right-[22px] z-[3] text-white bg-[#123d2be6] text-[9px] tracking-[0.16em] p-[7px_12px] uppercase font-bold max-md:text-[8px] max-md:bottom-3 max-md:right-[6%]">
              Tundikhel · Kathmandu
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="workflow grid grid-cols-3 mx-[4%] p-[40px_0_46px] border-t border-[#a8b49f] max-md:mx-[6%] max-md:grid-cols-1 max-md:p-[12px_0_20px]"
          aria-label="How Criico works"
        >
          <article
            className="p-[0_32px] border-l border-[#b9c2b0] first:pl-0 first:border-l-0 last:pr-0 max-md:p-[24px_0] max-md:border-l-0 max-md:border-b max-md:border-border last:max-md:border-b-0"
            id="features"
          >
            <span className="step block text-accent text-[20px] font-extrabold mb-2 max-md:float-left max-md:mr-[18px] max-md:text-[18px] max-md:leading-[1.7]">
              01
            </span>
            <h2 className="text-[clamp(20px,2vw,28px)] tracking-[-0.035em] font-extrabold text-foreground max-md:text-[23px]">
              Build your roster
            </h2>
            <p className="text-[#435145] text-[15px] leading-[1.8] mt-3 max-w-[32ch] max-md:ml-[44px] max-md:max-w-[40ch] max-md:text-[14px]">
              Add players, set their roles, and manage their career statistics.
            </p>
            <Link
              className="inline-flex items-center gap-2 text-[11px] font-bold mt-[22px] text-foreground hover:text-accent transition-colors max-md:ml-[44px] max-md:mt-[15px]"
              href={user ? '/dashboard/players' : '/register'}
            >
              {user ? 'Manage your squad' : 'Meet your next squad'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article className="p-[0_32px] border-l border-[#b9c2b0] first:pl-0 first:border-l-0 last:pr-0 max-md:p-[24px_0] max-md:border-l-0 max-md:border-b max-md:border-border last:max-md:border-b-0">
            <span className="step block text-accent text-[20px] font-extrabold mb-2 max-md:float-left max-md:mr-[18px] max-md:text-[18px] max-md:leading-[1.7]">
              02
            </span>
            <h2 className="text-[clamp(20px,2vw,28px)] tracking-[-0.035em] font-extrabold text-foreground max-md:text-[23px]">
              Record the match
            </h2>
            <p className="text-[#435145] text-[15px] leading-[1.8] mt-3 max-w-[32ch] max-md:ml-[44px] max-md:max-w-[40ch] max-md:text-[14px]">
              Record match results, runs, and wickets in one place.
            </p>
            <Link
              className="inline-flex items-center gap-2 text-[11px] font-bold mt-[22px] text-foreground hover:text-accent transition-colors max-md:ml-[44px] max-md:mt-[15px]"
              href={user ? '/dashboard/matches' : '/register'}
            >
              {user ? 'Open matchbook' : 'Make every match count'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article className="p-[0_32px] border-l border-[#b9c2b0] first:pl-0 first:border-l-0 last:pr-0 max-md:p-[24px_0] max-md:border-l-0 max-md:border-b max-md:border-border last:max-md:border-b-0">
            <span className="step block text-accent text-[20px] font-extrabold mb-2 max-md:float-left max-md:mr-[18px] max-md:text-[18px] max-md:leading-[1.7]">
              03
            </span>
            <h2 className="text-[clamp(20px,2vw,28px)] tracking-[-0.035em] font-extrabold text-foreground max-md:text-[23px]">
              See the impact
            </h2>
            <p className="text-[#435145] text-[15px] leading-[1.8] mt-3 max-w-[32ch] max-md:ml-[44px] max-md:max-w-[40ch] max-md:text-[14px]">
              Compare player contributions on your squad leaderboard.
            </p>
            <Link
              className="inline-flex items-center gap-2 text-[11px] font-bold mt-[22px] text-foreground hover:text-accent transition-colors max-md:ml-[44px] max-md:mt-[15px]"
              href={user ? '/dashboard/leaderboard' : '/register'}
            >
              {user ? 'View leaderboard' : 'Find your game changers'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
        </section>
      </main>
      <footer className="site-footer flex items-center justify-between mx-[4%] border-t border-[#a8b49f] p-[30px_0] gap-5 max-md:mx-[6%] max-md:flex-wrap max-md:gap-6 max-md:p-[26px_0]">
        <Brand className="text-[28px]" />
        <p className="text-[13px] font-bold text-foreground max-md:text-[11px]">
          Cricket. Community. Together.
        </p>
        <span className="text-[10px] tracking-[0.12em] uppercase text-foreground max-md:w-full max-md:text-[9px]">
          Grassroots cricket, Nepal
        </span>
      </footer>
    </>
  );
}
