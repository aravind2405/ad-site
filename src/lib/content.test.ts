import { describe, expect, it } from 'vitest';
import {
  getProject,
  gridProjects,
  lab,
  neighbours,
  nextUpLine,
  nextUpProjects,
  profile,
  projects,
} from './content';

describe('content', () => {
  it('has unique project slugs and resolves each one', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(getProject(slug)?.slug).toBe(slug);
    expect(getProject('does-not-exist')).toBeUndefined();
  });

  it('lists every started project with a repository', () => {
    for (const p of projects.filter((x) => x.status !== 'coming-soon')) {
      expect(p.repo).toMatch(/^aravind2405\//);
    }
  });

  it('shows only projects with a repo and real work on the grid', () => {
    expect(gridProjects.map((p) => p.slug)).toEqual(['rentlens', 'ontimesydney']);
    for (const p of gridProjects) {
      expect(p.repo, p.slug).toMatch(/^aravind2405\//);
      expect(getProject(p.slug), p.slug).toBeDefined();
      expect(p.stack.length, p.slug).toBeGreaterThan(0);
      expect(p.details.overview.length, p.slug).toBeGreaterThan(0);
    }
  });

  it('keeps planned projects off the grid but with their own page', () => {
    expect(nextUpProjects.map((p) => p.slug)).toEqual(['gridwatch', 'groundtruth']);
    expect(nextUpLine()).toBe(
      'Next up: GridWatch AU (grid data on AWS) and GroundTruth (evaluated AI search).',
    );
    for (const p of nextUpProjects) expect(getProject(p.slug)).toBeDefined();
  });

  it('never labels a stack tag as planned', () => {
    for (const p of projects) {
      for (const tag of p.stack) expect(tag.toLowerCase(), p.slug).not.toContain('planned');
    }
    expect(JSON.stringify(projects)).not.toContain('(planned)');
  });

  it('links case studies to grid projects only, wrapping around', () => {
    expect(neighbours('rentlens')).toMatchObject({
      previous: { slug: 'ontimesydney' },
      next: { slug: 'ontimesydney' },
    });
    expect(neighbours('gridwatch')).toMatchObject({
      previous: { slug: 'ontimesydney' },
      next: { slug: 'rentlens' },
    });
  });

  it('does not publish an email address while the contact form is not built', () => {
    expect(profile.links.email).toBeNull();
  });

  it('keeps lab claims honest: no lab experiment claims data that does not exist yet', () => {
    const text = JSON.stringify(lab).toLowerCase();
    expect(text).not.toContain('months of my own');
  });
});
