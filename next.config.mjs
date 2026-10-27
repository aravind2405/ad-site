import { execSync } from 'node:child_process';

const isDev = process.env.NODE_ENV !== 'production';

// Date of the latest commit, inlined at build so ISR refreshes do not change it.
// Falls back to the build date when git history is not available.
function lastUpdated() {
  try {
    const out = execSync('git log -1 --format=%cI', { stdio: ['ignore', 'pipe', 'ignore'] });
    const iso = out.toString().trim();
    if (iso) return iso;
  } catch {
    // no git history here
  }
  return new Date().toISOString();
}

// Next.js injects inline scripts for hydration, so script-src needs 'unsafe-inline'
// (a nonce would force every page to render per request). Dev mode also needs 'unsafe-eval'.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  'frame-src https://aravind2405.github.io',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  env: { LAST_UPDATED: lastUpdated() },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // The old Vercel address permanently forwards to the custom domain.
  async redirects() {
    return [
      // The RentLens page moved under /projects.
      { source: '/rentlens', destination: '/projects/rentlens', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'aravind-ad.vercel.app' }],
        destination: 'https://www.aravindd.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
