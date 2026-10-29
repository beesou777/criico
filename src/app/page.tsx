import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { getSessionUser } from '@/lib/session';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <>
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#clubhouse">The clubhouse</a>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          {user && (
            <Link href="/dashboard">Dashboard</Link>
          )}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="signin-link">
                Clubhouse
              </Link>
              <Link href="/dashboard" className="button button-primary">
                Dashboard <ArrowRight size={18} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="signin-link">
                Sign in
              </Link>
              <Link href="/register" className="button button-primary">
                Start your squad <ArrowRight size={18} />
              </Link>
            </>
          )}
        </div>
      </header>
      <main id="main">
        <section className="hero" id="clubhouse" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Every player.
              <br />
              Every match.
              <br />
              <span>Every bit of impact.</span>
            </h1>
            <p>
              Build your roster, record the match, and give every performance
              its place on the board.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link href="/dashboard" className="button button-primary">
                  Go to Dashboard <ArrowRight size={19} />
                </Link>
              ) : (
                <Link href="/register" className="button button-primary">
                  Start your squad <ArrowRight size={19} />
                </Link>
              )}
              <a href="#how-it-works" className="button button-outline">
                How it works
              </a>
            </div>
            <div className="hero-footnote">
              <span className="small-wicket" aria-hidden="true" />
              Made for the local game. Built around your players.
            </div>
          </div>
          <div className="hero-field">
            <Image
              src="/images/cricket-ground.png"
              alt="Illustrated aerial view of a tree-lined cricket ground with players at the crease"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 52vw"
              className="ground-image"
            />
            <svg
              className="delivery-path"
              viewBox="0 0 600 600"
              aria-hidden="true"
            >
              <path className="trajectory" d="M290 390 Q345 205 485 320" />
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
            <div className="field-caption">
              THE LOCAL GROUND. THE BIGGER PICTURE.
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="workflow"
          aria-label="How Criico works"
        >
          <article id="features">
            <span className="step">01</span>
            <h2>Build your roster</h2>
            <p>
              Add players, set their roles, and manage their career statistics.
            </p>
            <Link href={user ? '/dashboard/players' : '/register'}>
              {user ? 'Manage your squad' : 'Meet your next squad'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article>
            <span className="step">02</span>
            <h2>Record the match</h2>
            <p>Record match results, runs, and wickets in one place.</p>
            <Link href={user ? '/dashboard/matches' : '/register'}>
              {user ? 'Open matchbook' : 'Make every match count'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article>
            <span className="step">03</span>
            <h2>See the impact</h2>
            <p>Compare player contributions on your squad leaderboard.</p>
            <Link href={user ? '/dashboard/leaderboard' : '/register'}>
              {user ? 'View leaderboard' : 'Find your game changers'}{' '}
              <ArrowUpRight size={17} />
            </Link>
          </article>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <p>Cricket. Community. Together.</p>
        <span>Grassroots cricket, Nepal</span>
      </footer>
    </>
  );
}
