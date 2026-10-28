'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  count: number;
  children: ReactNode;
}

// The project slides: a row that snaps one slide at a time. A finger swipes it on a phone; on a
// computer the two buttons move it, and Tab moves it too, because a focused link scrolls into view.
export default function ProjectCarousel({ count, children }: Props) {
  const row = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestGap = Infinity;
      Array.from(el.children).forEach((slide, i) => {
        const s = slide as HTMLElement;
        const gap = Math.abs(s.offsetLeft + s.offsetWidth / 2 - middle);
        if (gap < bestGap) {
          bestGap = gap;
          best = i;
        }
      });
      setIndex(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = (to: number) => {
    const slide = row.current?.children[to];
    if (!slide) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    slide.scrollIntoView({
      behavior: calm ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <div className="carousel">
      <div className="project-grid" ref={row}>
        {children}
      </div>
      <div className="carousel-controls">
        <button
          type="button"
          className="carousel-btn"
          aria-label="Previous project"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="carousel-count" aria-live="polite">
          Project {index + 1} of {count}
        </span>
        <button
          type="button"
          className="carousel-btn"
          aria-label="Next project"
          disabled={index === count - 1}
          onClick={() => go(index + 1)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
