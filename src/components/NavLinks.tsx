'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  resume: string | null;
}

const links = [
  { href: '/#projects', label: 'Projects', match: (p: string) => p.startsWith('/projects') },
  { href: '/lab', label: 'Lab', match: (p: string) => p.startsWith('/lab') },
  { href: '/shelf', label: 'Shelf', match: (p: string) => p.startsWith('/shelf') },
];

// The menu below 340px is a <details> element, so it works without JavaScript.
// This handler only closes it after a link is followed.
function closeMenu(e: MouseEvent<HTMLElement>) {
  e.currentTarget.closest('details')?.removeAttribute('open');
}

export default function NavLinks({ resume }: Props) {
  const pathname = usePathname();
  const items = (onClick?: (e: MouseEvent<HTMLElement>) => void) => (
    <>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.match(pathname) ? 'page' : undefined}
          onClick={onClick}
        >
          {l.label}
        </Link>
      ))}
      {resume && (
        <a href={resume} download="Aravind-Danassegarane-Resume.pdf" onClick={onClick}>
          Resume
        </a>
      )}
    </>
  );
  return (
    <div className="nav-links">
      <div className="nav-main">{items()}</div>
      <details className="nav-menu">
        <summary>Menu</summary>
        <div className="nav-sheet">{items(closeMenu)}</div>
      </details>
      <Link className="btn btn-sm btn-primary nav-cta" href="/#contact">
        Contact
      </Link>
    </div>
  );
}
