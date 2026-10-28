'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  resume: string | null;
}

// Each nav item points at a page or a section of the home page. `section` is the id of the home
// page section that lights the item while it is on screen.
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

// On phones the links live in a <details> menu, so it works without JavaScript. This closes it after
// a link is followed.
function closeMenu(e: MouseEvent<HTMLElement>) {
  e.currentTarget.closest('details')?.removeAttribute('open');
}

export default function NavLinks({ resume }: Props) {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);

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
      for (const l of links) {
        const el = document.getElementById(l.section);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = l.section;
      }
      // Nothing is lit on the hero; the last section is lit once the page cannot scroll further.
      if (window.scrollY < 8) current = null;
      else if (atBottom) {
        const last = [...links].reverse().find((l) => document.getElementById(l.section));
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

  // Escape closes the phone menu and returns focus to its button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = menu.current;
      if (e.key === 'Escape' && el?.open) {
        el.removeAttribute('open');
        el.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const items = (cta: boolean, onClick?: (e: MouseEvent<HTMLElement>) => void) => (
    <>
      {links.map((l) => {
        const onPage = l.page(pathname);
        const inView = pathname === '/' && section === l.section;
        const isCta = cta && l.section === 'contact';
        return (
          <Link
            key={l.href}
            href={l.href}
            className={isCta ? 'btn btn-sm btn-primary nav-cta' : undefined}
            aria-current={onPage ? 'page' : inView ? 'location' : undefined}
            onClick={onClick}
          >
            {l.label}
          </Link>
        );
      })}
      {resume && (
        <a href={resume} download="Aravind-Danassegarane-Resume.pdf" onClick={onClick}>
          Resume
        </a>
      )}
    </>
  );
  return (
    <div className="nav-links">
      <div className="nav-main">{items(true)}</div>
      <details className="nav-menu" ref={menu}>
        <summary>Menu</summary>
        <div className="nav-sheet">{items(false, closeMenu)}</div>
      </details>
    </div>
  );
}
