import type { ReactNode } from 'react';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import { profile } from '@/lib/content';
import { formatDate } from '@/lib/format';

// Sections below the first screen fade and rise once as they scroll into view. Without
// JavaScript (or with reduced motion) nothing is hidden: the hidden state needs the js class.
// A watcher picks up sections added by client-side navigation, which never reloads this script.
const revealScript = `(function(){if(!('IntersectionObserver' in window))return;document.documentElement.classList.add('js');var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});function scan(n){if(n.nodeType!==1)return;if(n.matches('.reveal'))io.observe(n);n.querySelectorAll('.reveal').forEach(function(el){io.observe(el)})}scan(document.body);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(scan)})}).observe(document.body,{childList:true,subtree:true})})();`;

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
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <script dangerouslySetInnerHTML={{ __html: revealScript }} />
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
