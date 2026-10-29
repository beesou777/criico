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
    <main id="main" className="auth-shell">
      <section className="auth-story">
        <Brand light />
        <div>
          <span className="auth-stumps" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2>
            Your ground.
            <br />
            Your players.
            <br />
            Your clubhouse.
          </h2>
          <p>
            Good cricket starts with a community.
            <br />
            Give yours a place to grow.
          </p>
        </div>
        <p className="auth-tagline">Cricket. Community. Together.</p>
      </section>
      <section className="auth-content">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          Back to the ground
        </Link>
        <div className="auth-panel">
          <h1>{title}</h1>
          <p className="muted">{description}</p>
          {children}
        </div>
        <p className="auth-bottom">Grassroots cricket, Nepal</p>
      </section>
    </main>
  );
}
