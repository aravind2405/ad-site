'use client';

import { useEffect, useState } from 'react';

type Rgb = [number, number, number];

interface Tone {
  id: string;
  label: string;
  bg: Rgb;
  // two soft colour glows and the faint grid, per page
  a: Rgb;
  b: Rgb;
  grid: Rgb;
  gridAlpha: number;
  dark: number;
}

// One entry per home page, in order. The page behind the content blends from one entry to the next
// as the scroll moves between them, so there is never a hard colour edge.
const tones: Tone[] = [
  {
    id: 'hero',
    label: 'Intro',
    bg: [244, 245, 242],
    a: [214, 211, 202],
    b: [234, 230, 218],
    grid: [22, 24, 29],
    gridAlpha: 0.05,
    dark: 0,
  },
  {
    id: 'projects',
    label: 'Projects',
    bg: [242, 237, 225],
    a: [226, 214, 190],
    b: [214, 219, 208],
    grid: [22, 24, 29],
    gridAlpha: 0.045,
    dark: 0,
  },
  {
    id: 'lab',
    label: 'Curiosity Lab',
    bg: [20, 22, 27],
    a: [62, 66, 72],
    b: [76, 70, 62],
    grid: [255, 255, 255],
    gridAlpha: 0.06,
    dark: 1,
  },
  {
    id: 'contact',
    label: 'Contact',
    bg: [244, 245, 242],
    a: [219, 216, 208],
    b: [233, 228, 214],
    grid: [22, 24, 29],
    gridAlpha: 0.05,
    dark: 0,
  },
];

const mix = (from: number, to: number, t: number) => from + (to - from) * t;
const mixRgb = (from: Rgb, to: Rgb, t: number): Rgb => [
  mix(from[0], to[0], t),
  mix(from[1], to[1], t),
  mix(from[2], to[2], t),
];
const channels = (c: Rgb) => c.map(Math.round).join(' ');

// The fixed page behind the home bands, plus a small rail of dots to jump between pages. It only
// reads scroll positions and sets CSS variables; it never moves the scroll.
export default function HomeStage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const sections = tones.map((t) => document.getElementById(t.id));
    const header = document.querySelector('.site-header');
    if (sections.some((s) => !s) || !header) return;
    root.classList.add('stage-on');
    let frame = 0;
    let current = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY + header.getBoundingClientRect().height;
      const tops = sections.map((s) => s!.getBoundingClientRect().top + window.scrollY);
      const last = tops.length - 1;
      let position = 0;
      if (y >= tops[last]) position = last;
      else if (y > tops[0]) {
        const i = tops.findIndex((top, k) => y >= top && y < tops[k + 1]);
        position = i + (y - tops[i]) / (tops[i + 1] - tops[i]);
      }
      const i = Math.min(Math.floor(position), last - 1);
      const u = Math.min(Math.max(position - i, 0), 1);
      // smootherstep: flat at both ends and quick through the middle, so the in-between greys are brief
      const eased = u * u * u * (u * (u * 6 - 15) + 10);
      // text colours flip in a narrow window around the middle, where neither would read well
      const flip = Math.min(Math.max((eased - 0.4) / 0.2, 0), 1);
      const from = tones[i];
      const to = tones[i + 1];
      const set = (name: string, value: string) => root.style.setProperty(name, value);
      set('--stage-bg', `rgb(${channels(mixRgb(from.bg, to.bg, eased))})`);
      set('--stage-a', channels(mixRgb(from.a, to.a, eased)));
      set('--stage-b', channels(mixRgb(from.b, to.b, eased)));
      set(
        '--stage-grid',
        `rgb(${channels(mixRgb(from.grid, to.grid, eased))} / ${mix(from.gridAlpha, to.gridAlpha, eased).toFixed(3)})`,
      );
      set('--dark', mix(from.dark, to.dark, flip * flip * (3 - 2 * flip)).toFixed(3));
      const near = Math.round(position);
      if (near !== current) {
        current = near;
        setActive(near);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove('stage-on');
      for (const name of ['--stage-bg', '--stage-a', '--stage-b', '--stage-grid', '--dark']) {
        root.style.removeProperty(name);
      }
    };
  }, []);

  return (
    <>
      <div className="stage" aria-hidden="true">
        <div className="stage-blob stage-blob-a" />
        <div className="stage-blob stage-blob-b" />
        <div className="stage-grid" />
      </div>
      <nav className="stage-rail" aria-label="Home page sections">
        <ol>
          {tones.map((t, i) => (
            <li key={t.id}>
              <a href={`#${t.id}`} aria-current={active === i ? 'location' : undefined}>
                <span className="sr-only">{t.label}</span>
                <span className="dot" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
