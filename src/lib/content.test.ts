import { describe, expect, it } from 'vitest';
import { getProject, lab, profile, projects, shelf } from './content';

describe('content', () => {
  it('has unique project slugs and resolves each one', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(getProject(slug)?.slug).toBe(slug);
    expect(getProject('does-not-exist')).toBeUndefined();
  });

  it('only links shelf items to pages that exist', () => {
    const known = new Set(['/lab', '/shelf', '/']);
    for (const item of shelf) if (item.related) expect(known.has(item.related.href)).toBe(true);
  });

  it('lists every started project with a repository', () => {
    for (const p of projects.filter((x) => x.status !== 'coming-soon')) {
      expect(p.repo).toMatch(/^aravind2405\//);
    }
  });

  it('does not publish an email address while the contact form is not built', () => {
    expect(profile.links.email).toBeNull();
  });

  it('keeps lab claims honest: no lab experiment claims data that does not exist yet', () => {
    const text = JSON.stringify(lab).toLowerCase();
    expect(text).not.toContain('months of my own');
  });
});
