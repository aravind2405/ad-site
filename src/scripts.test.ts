import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = process.cwd();
const dirs: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), 'ad-site-check-'));
  dirs.push(dir);
  return dir;
};
const run = (script: string, args: string[] = [], env: Record<string, string> = {}) =>
  spawnSync('node', [join(root, 'scripts', script), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('privacy check', () => {
  it('passes on files with no email address', () => {
    const dir = scratch();
    writeFileSync(join(dir, 'page.html'), '<p>Reach me on LinkedIn. v1.2.3 @2x.png</p>');
    expect(run('check-privacy.mjs', [dir]).status).toBe(0);
  });

  it('fails on an email address in HTML or in JavaScript', () => {
    for (const [file, body] of [
      ['page.html', '<a href="mailto:someone@example.org">mail</a>'],
      ['chunk.js', 'const c="first.last+tag@sub.example.co.uk";'],
    ]) {
      const dir = scratch();
      mkdirSync(join(dir, 'nested'));
      writeFileSync(join(dir, 'nested', file), body);
      const result = run('check-privacy.mjs', [dir]);
      expect(result.status, file).toBe(1);
      expect(result.stderr).toContain('Email-shaped text');
    }
  });

  it('reports a missing build directory instead of passing', () => {
    expect(run('check-privacy.mjs', [join(scratch(), 'nope')]).status).toBe(2);
  });
});

describe('receipt check', () => {
  const setup = (copy: unknown, metrics: string) => {
    const dir = scratch();
    mkdirSync(join(dir, 'data'));
    writeFileSync(join(dir, 'data', 'p.json'), JSON.stringify(copy));
    writeFileSync(join(dir, 'METRICS.md'), metrics);
    writeFileSync(join(dir, 'allow.json'), JSON.stringify({ allowed: { '2026': 'year' } }));
    return {
      RECEIPTS_DATA_DIR: join(dir, 'data'),
      RECEIPTS_METRICS: join(dir, 'METRICS.md'),
      RECEIPTS_ALLOWLIST: join(dir, 'allow.json'),
    };
  };

  it('fails on a number with no receipt', () => {
    const result = run('check-receipts.mjs', [], setup({ summary: 'Loads 4,200 rows' }, 'nothing'));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('4,200');
  });

  it('passes when METRICS.md has the number, ignoring dates and versions', () => {
    const env = setup(
      { summary: 'Loads 4,200 rows in v0.1', date: '2026-10-24' },
      '| rows | 4,200 | cmd |',
    );
    expect(run('check-receipts.mjs', [], env).status).toBe(0);
  });

  it('does not accept a number that only appears inside a date in METRICS.md', () => {
    const result = run(
      'check-receipts.mjs',
      [],
      setup({ summary: 'Handles 24 sources' }, 'Measured 2026-10-24 at 13:02'),
    );
    expect(result.status).toBe(1);
  });

  it('accepts allowlisted numbers', () => {
    expect(run('check-receipts.mjs', [], setup({ line: 'Graduating 2026' }, '')).status).toBe(0);
  });

  it('passes on the real site content', () => {
    expect(run('check-receipts.mjs').status).toBe(0);
  });
});
