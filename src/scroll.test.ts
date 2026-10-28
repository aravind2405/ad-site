import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('native scrolling only', () => {
  it('has no code that takes over, smooths or intercepts scrolling', () => {
    const forbidden = [
      /addEventListener\(\s*['"](wheel|mousewheel|touchmove|DOMMouseScroll)['"]/,
      /\bonWheel\b|\bonTouchMove\b/,
      /\.scrollTo\(|\.scrollBy\(|\.scrollIntoView\(|scrollTop\s*=|scrollLeft\s*=/,
      /lenis|locomotive|gsap|scrolltrigger|fullpage|scrollmagic|smooth-scrollbar|framer-motion/i,
      /overflow-anchor/,
    ];
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        expect(pattern.test(text), `${file} matches ${pattern}`).toBe(false);
      }
      // Cancelling an event is only for the contact form's own submit handler.
      if (!file.endsWith('ContactForm.tsx')) {
        expect(/preventDefault\(\)/.test(text), `${file} cancels an event`).toBe(false);
      }
    }
  });

  it('snaps the home page one screen at a time, only where motion is welcome', () => {
    // Native CSS snapping, one page per swipe or scroll. Never under reduced motion.
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{\s*html:has\(\.home\) \{\s*scroll-snap-type: y mandatory;/,
    );
    expect(css).toMatch(
      /\.home > section \{\s*scroll-snap-align: start;\s*scroll-snap-stop: always;/,
    );
    // The only other snapping is the sideways row of project cards on phones.
    const snaps = [...css.matchAll(/scroll-snap-type:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(snaps).toEqual(['y mandatory', 'x mandatory']);
    expect(css).not.toMatch(/proximity/);
  });

  it('uses small-viewport units, never the plain vh that jumps with the mobile address bar', () => {
    expect(css).not.toMatch(/\b\d+(\.\d+)?vh\b/);
    expect(css).toMatch(/100svh/);
  });

  it('keeps nav clearance in one place', () => {
    expect(css).toMatch(
      /scroll-padding-top:\s*calc\(var\(--header-h\) \+ var\(--stroke-hairline\)\)/,
    );
  });
});

describe('spacing scale', () => {
  it('is one scale of 8, 16, 24, 48 and 96 px', () => {
    const scale = Object.fromEntries(
      [...tokens.matchAll(/--rhythm-(\d):\s*(\d+)px;/g)].map((m) => [m[1], Number(m[2])]),
    );
    expect(scale).toEqual({ 1: 8, 2: 16, 3: 24, 4: 48, 5: 96 });
  });

  it('is what the home page bands use for their own spacing', () => {
    for (const selector of ['.projects-band', '.lab-band', '.contact-band']) {
      const escaped = selector.replace('.', '\\.');
      const blocks = [...css.matchAll(new RegExp(`^${escaped}\\s*\\{[^}]*\\}`, 'gm'))].map(
        (m) => m[0],
      );
      expect(
        blocks.some((b) => b.includes('--rhythm-')),
        selector,
      ).toBe(true);
      for (const block of blocks) expect(block, selector).not.toMatch(/padding[^;]*\b\d+px/);
    }
  });
});
