import type { ReactNode } from 'react';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import { profile } from '@/lib/content';
import { formatDate } from '@/lib/format';

// Phones only: hide the header on scroll down, show it on scroll up or when it has focus.
const headerScript = `(function(){var h=document.querySelector('.site-header');if(!h)return;var m=matchMedia('(max-width:767px)'),y=scrollY;addEventListener('scroll',function(){var c=scrollY;if(!m.matches){h.classList.remove('is-hidden');y=c;return}if(c-y>0&&c>8&&!h.contains(document.activeElement)){h.classList.add('is-hidden')}else if(c<y){h.classList.remove('is-hidden')}y=c},{passive:true});h.addEventListener('focusin',function(){h.classList.remove('is-hidden')})})();`;

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
          <NavLinks resume={profile.links.resume} />
        </nav>
      </header>
      <script dangerouslySetInnerHTML={{ __html: headerScript }} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap">
          {footer ?? (
            <>
              <ul className="footer-links">
                {profile.links.linkedin && (
                  <li>
                    <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )}
                {profile.links.github && (
                  <li>
                    <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
                      GitHub<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )}
                {profile.links.resume && (
                  <li>
                    <a href={profile.links.resume} download="Aravind-Danassegarane-Resume.pdf">
                      Resume
                    </a>
                  </li>
                )}
              </ul>
              <p className="footer-meta">
                <span>© 2026 {profile.name}</span>
                <span>
                  Last updated{' '}
                  <time dateTime={process.env.LAST_UPDATED}>
                    {formatDate(process.env.LAST_UPDATED ?? '')}
                  </time>
                </span>
                <a
                  href="https://github.com/aravind2405/ad-site"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How this site is built<span className="sr-only"> (opens in a new tab)</span>
                </a>
                <a href="https://github.com/aravind2405/ad-site/blob/main/LICENSE">
                  Code under the MIT licence
                </a>
              </p>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
