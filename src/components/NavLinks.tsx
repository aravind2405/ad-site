'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  resume: string | null;
}

// Each nav item points at a page or a section of the home page. `section` is the id of the home
// page section that lights the item while it is on screen. On the home page, Projects is left out:
// people scroll to it, and the page itself leads there. It stays on inner pages as the way back.
const links = [
  {
    href: '/#projects',
    label: 'Projects',
    section: 'projects',
    page: (p: string) => p.startsWith('/projects'),
  },
  {
    href: '/lab',
    label: 'Curiosity Lab',
    section: 'lab',
    page: (p: string) => p.startsWith('/lab'),
  },
  { href: '/#contact', label: 'Contact', section: 'contact', page: () => false },
];

// On the home page Projects is left out; on inner pages it is the way back.
const visibleLinks = (pathname: string) =>
  pathname === '/' ? links.filter((l) => l.section !== 'projects') : links;

export default function NavLinks({ resume }: Props) {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);
  const visible = visibleLinks(pathname);

  // On the home page, highlight the section that crosses a line 45% down the screen. This only
  // reads positions; it never changes the scroll.
  useEffect(() => {
    if (pathname !== '/') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      let current: string | null = null;
      const visible = visibleLinks(pathname);
      for (const l of visible) {
        const el = document.getElementById(l.section);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = l.section;
      }
      // Nothing is lit on the hero; the last section is lit once the page cannot scroll further.
      if (window.scrollY < 8) current = null;
      else if (atBottom) {
        const last = [...visible].reverse().find((l) => document.getElementById(l.section));
        current = last ? last.section : current;
      }
      setSection(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div className="nav-links">
      <div className="nav-main">
        {visible.map((l) => {
          const onPage = l.page(pathname);
          const inView = pathname === '/' && section === l.section;
          const isCta = l.section === 'contact';
          return (
            <Link
              key={l.href}
              href={l.href}
              className={isCta ? 'btn btn-sm btn-primary nav-cta' : undefined}
              aria-current={onPage ? 'page' : inView ? 'location' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
        {resume && (
          <a href={resume} download="Aravind-Danassegarane-Resume.pdf">
            Resume
          </a>
        )}
      </div>
    </div>
  );
}
