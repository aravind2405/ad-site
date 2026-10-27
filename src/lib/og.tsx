import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

// Open Graph card: the AD. wordmark and the page's question, in the site's own colours
// (light, or the dark Lab colours).
export function ogImage(title: string, dark = false) {
  const bg = dark ? '#14161b' : '#f4f5f2';
  const ink = dark ? '#f2f3f0' : '#16181d';
  const muted = dark ? '#d3d7de' : '#4a5260';
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: bg,
        color: ink,
        padding: '72px 80px',
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>AD.</div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
      <div style={{ fontSize: 28, color: muted }}>www.aravindd.com</div>
    </div>,
    ogSize,
  );
}
