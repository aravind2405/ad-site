import type { ReactNode } from 'react';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import { profile } from '@/lib/content';

interface Props {
  footer?: ReactNode;
  children: ReactNode;
}

export default function SiteShell({ footer, children }: Props) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <nav className="wrap site-nav" aria-label="Main">
          <Link href="/" className="logo">
            AD.<span className="sr-only"> {profile.name}, home</span>
          </Link>
          <NavLinks />
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap">
          {footer ?? (
            <>
              <span>© 2026 {profile.name} · Sydney</span>
              <span>
                <a href="https://github.com/aravind2405/ad-site/blob/main/LICENSE">
                  Code under the MIT licence
                </a>
              </span>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
