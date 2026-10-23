import type { ReactNode } from 'react';
import Link from 'next/link';
import profileData from '@/data/profile.json';
import type { Profile } from '@/lib/types';

const profile: Profile = profileData;

type Current = 'home' | 'lab' | 'shelf';

interface Props {
  current?: Current;
  dark?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export default function SiteShell({ current = 'home', dark = false, footer, children }: Props) {
  const resume = profile.links.resume;
  return (
    <>
      <header className="site-header">
        <nav className="wrap site-nav" aria-label="Main">
          <Link href="/" className="logo" aria-label="AD. — Aravind Danassegarane, home">AD.</Link>
          <div className="nav-links">
            <Link href="/#projects">Projects</Link>
            <Link href="/lab" aria-current={current === 'lab' ? 'page' : undefined}>Curiosity Lab</Link>
            <Link href="/shelf" aria-current={current === 'shelf' ? 'page' : undefined}>Shelf</Link>
            <Link href="/#contact">Contact</Link>
            {resume && !dark && <a className="btn btn-ghost btn-sm" href={resume}>Resume</a>}
          </div>
        </nav>
      </header>
      <main id="top">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          {footer ?? (
            <>
              <span>© 2026 {profile.name} · Sydney</span>
              <span><a href="https://github.com/aravind2405/ad-site/blob/main/LICENSE">Code under the MIT licence</a></span>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
