import { describe, expect, it } from 'vitest';
import { projects } from './content';
import { profileSchema, projectSchema, shelfSchema } from './schemas';

const base = projects.find((p) => p.status === 'live')!;
const planned = projects.find((p) => p.status === 'planned')!;

describe('project schema', () => {
  it('accepts every project shipped with the site', () => {
    for (const p of projects) expect(() => projectSchema.parse(p)).not.toThrow();
  });

  it('rejects a planned project that links a repository', () => {
    expect(projectSchema.safeParse({ ...planned, repo: 'aravind2405/x' }).success).toBe(false);
  });

  it('rejects a planned project that links a live demo', () => {
    expect(projectSchema.safeParse({ ...planned, live: 'https://example.com/demo' }).success).toBe(
      false,
    );
  });

  it('rejects a planned project that lists a built stack', () => {
    expect(projectSchema.safeParse({ ...planned, stack: ['Python'] }).success).toBe(false);
  });

  it('rejects a live project without a live URL', () => {
    expect(projectSchema.safeParse({ ...base, live: null }).success).toBe(false);
  });

  it('rejects a started project without a repository', () => {
    expect(projectSchema.safeParse({ ...base, repo: null, status: 'in-progress' }).success).toBe(
      false,
    );
  });

  it('rejects a malformed slug, repo name or non-HTTPS URL', () => {
    expect(projectSchema.safeParse({ ...base, slug: 'Not A Slug' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, repo: 'not-a-repo' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, live: 'http://example.com' }).success).toBe(false);
  });

  it('rejects a bad verification date', () => {
    expect(
      projectSchema.safeParse({ ...base, verified: { date: '24/10/2026', against: 'README' } })
        .success,
    ).toBe(false);
  });
});

describe('profile and shelf schemas', () => {
  it('requires HTTPS social links and a valid email when one is set', () => {
    const p = {
      name: 'A',
      headline: 'h',
      subheadline: 's',
      credentials: 'c',
      contact: { heading: 'h', body: 'b' },
      links: { email: null, resume: null, linkedin: 'https://linkedin.com/in/x', github: null },
    };
    expect(profileSchema.safeParse(p).success).toBe(true);
    expect(
      profileSchema.safeParse({ ...p, links: { ...p.links, github: 'http://x.com' } }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({ ...p, links: { ...p.links, email: 'nope' } }).success).toBe(
      false,
    );
  });

  it('only allows internal links on shelf items', () => {
    const item = {
      status: 'next',
      kind: 'Paper',
      title: 't',
      by: 'b',
      related: { name: 'x', href: 'https://evil.example' },
    };
    expect(shelfSchema.safeParse([item]).success).toBe(false);
  });
});
