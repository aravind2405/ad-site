'use client';

import { useEffect, useRef, useState } from 'react';
import { paletteFor, themeVariables } from '@/lib/diagramTheme';

interface Props {
  /** Mermaid text. The first line is `flowchart LR`; phones get `TB` so it stays narrow. */
  definition: string;
  /** What the diagram shows, for people who cannot see it. */
  label: string;
}

let counter = 0;

/**
 * Draws a Mermaid diagram once it is near the screen, so the large Mermaid library is never
 * downloaded for people who do not scroll to it. Until then, and if drawing fails or JavaScript is
 * off, the page's plain step list stays visible. The drawing follows the colour of the place it sits
 * in, so it suits light and dark pages.
 */
export default function Diagram({ definition, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let started = false;
    let orientation = '';

    const draw = async () => {
      const narrow = el.clientWidth < 640;
      const wanted = narrow ? 'TB' : 'LR';
      if (wanted === orientation) return;
      orientation = wanted;
      const { default: mermaid } = await import('mermaid');
      const style = getComputedStyle(el);
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: themeVariables(paletteFor(style.color), style.fontFamily),
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
          padding: 10,
          nodeSpacing: 24,
          rankSpacing: 34,
        },
      });
      const text = definition.replace(/^flowchart\s+\w+/m, `flowchart ${wanted}`);
      const { svg: drawn } = await mermaid.render(`diagram-${(counter += 1)}`, text);
      if (!cancelled) setSvg(drawn);
    };

    const start = () => {
      if (started) return;
      started = true;
      draw().catch(() => {
        orientation = '';
        setSvg(null);
        setFailed(true);
      });
      resize.observe(el);
    };
    const resize = new ResizeObserver(() => {
      if (started) draw().catch(() => undefined);
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      resize.disconnect();
    };
  }, [definition]);

  return (
    <div
      ref={host}
      className="diagram"
      data-state={svg ? 'drawn' : failed ? 'failed' : 'waiting'}
      role={svg ? 'img' : undefined}
      aria-label={svg ? label : undefined}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
