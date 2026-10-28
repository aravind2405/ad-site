// A decorative trace along the bottom of the hero: raw, noisy readings with a clean line drawing
// itself through them, and three ticks landing on the line. It carries no data.
const W = 1200;
const H = 150;
const POINTS = 48;

function clean(x: number) {
  const t = x / W;
  return H * (0.72 - 0.34 * t - 0.1 * Math.sin(t * Math.PI * 2.2));
}

// Fixed pseudo-noise, so the markup is the same on the server and the client.
function noise(i: number) {
  return Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453) - 0.5;
}

const xs = Array.from({ length: POINTS + 1 }, (_, i) => (i / POINTS) * W);
const cleanPath = xs
  .map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${clean(x).toFixed(1)}`)
  .join(' ');
const noisyPath = xs
  .map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${(clean(x) + noise(i) * 46).toFixed(1)}`)
  .join(' ');
const marks = [0.28, 0.58, 0.86].map((t) => {
  const y = clean(t * W);
  return `M${(t * W).toFixed(1)} ${(y - 16).toFixed(1)} L${(t * W).toFixed(1)} ${(y + 16).toFixed(1)}`;
});

export default function HeroSignal() {
  return (
    <svg
      className="signal"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="signal-raw" d={noisyPath} pathLength={1} />
      <path className="signal-clean" d={cleanPath} pathLength={1} />
      {marks.map((d, i) => (
        <path
          key={i}
          className="signal-mark"
          d={d}
          style={{ animationDelay: `${1.2 + i * 0.35}s` }}
        />
      ))}
    </svg>
  );
}
