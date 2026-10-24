'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/#projects', label: 'Projects', match: (p: string) => p.startsWith('/projects') },
  { href: '/lab', label: 'Curiosity Lab', match: (p: string) => p.startsWith('/lab') },
  { href: '/shelf', label: 'Shelf', match: (p: string) => p.startsWith('/shelf') },
  { href: '/#contact', label: 'Contact', match: () => false },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="nav-links">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.match(pathname) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}
