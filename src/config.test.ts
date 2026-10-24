import { afterEach, describe, expect, it, vi } from 'vitest';

interface Header {
  key: string;
  value: string;
}
interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
  has?: { type: string; value: string }[];
}
interface Config {
  poweredByHeader: boolean;
  headers: () => Promise<{ source: string; headers: Header[] }[]>;
  redirects: () => Promise<Redirect[]>;
}

// next.config.mjs reads NODE_ENV when it is imported, so load it fresh per environment.
async function loadConfig(env: 'production' | 'development'): Promise<Config> {
  vi.stubEnv('NODE_ENV', env);
  vi.resetModules();
  // @ts-expect-error -- plain JavaScript config file without type declarations
  const mod = await import('../next.config.mjs');
  return mod.default as Config;
}

afterEach(() => vi.unstubAllEnvs());

async function headersFor(env: 'production' | 'development') {
  const config = await loadConfig(env);
  const rules = await config.headers();
  return { config, rules, map: Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value])) };
}

describe('production security headers', () => {
  it('apply to every path', async () => {
    const { rules } = await headersFor('production');
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe('/:path*');
  });

  it('include all six security headers', async () => {
    const { map } = await headersFor('production');
    for (const key of [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
    ]) {
      expect(map[key], key).toBeTruthy();
    }
  });

  it('forbid framing, plugins and foreign base URLs or form targets', async () => {
    const { map } = await headersFor('production');
    const csp = map['Content-Security-Policy'];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(map['X-Frame-Options']).toBe('DENY');
    expect(map['X-Content-Type-Options']).toBe('nosniff');
  });

  it('allow only the dashboard origin as a frame', async () => {
    const { map } = await headersFor('production');
    expect(map['Content-Security-Policy']).toContain('frame-src https://aravind2405.github.io');
  });

  it('allow no eval and no remote script hosts', async () => {
    const { map } = await headersFor('production');
    const csp = map['Content-Security-Policy'];
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/);
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('hide the framework header', async () => {
    const { config } = await headersFor('production');
    expect(config.poweredByHeader).toBe(false);
  });
});

describe('development policy', () => {
  it('relaxes only what hot reload needs', async () => {
    const { map } = await headersFor('development');
    const csp = map['Content-Security-Policy'];
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
    expect(csp).not.toContain('upgrade-insecure-requests');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe('redirects', () => {
  it('move /rentlens permanently to the project page', async () => {
    const config = await loadConfig('production');
    expect(await config.redirects()).toContainEqual({
      source: '/rentlens',
      destination: '/projects/rentlens',
      permanent: true,
    });
  });

  it('send the old vercel.app host to the canonical www domain', async () => {
    const config = await loadConfig('production');
    const redirects = await config.redirects();
    const r = redirects.find((x) => x.has?.some((h) => h.value === 'aravind-ad.vercel.app'));
    expect(r?.destination).toBe('https://www.aravindd.com/:path*');
    expect(r?.permanent).toBe(true);
  });
});
