import labData from '@/data/lab.json';
import profileData from '@/data/profile.json';
import gridwatch from '@/data/projects/gridwatch.json';
import groundtruth from '@/data/projects/groundtruth.json';
import ontimesydney from '@/data/projects/ontimesydney.json';
import rentlens from '@/data/projects/rentlens.json';
import { labSchema, profileSchema, projectSchema, type Project } from './schemas';

// Every content file is validated when it is first imported, so invalid content
// fails the build (and the tests) instead of reaching visitors.
export const profile = profileSchema.parse(profileData);
export const lab = labSchema.parse(labData);

// Display order: live work first, then work in progress, then plans.
export const projects: Project[] = [rentlens, ontimesydney, gridwatch, groundtruth].map((p) =>
  projectSchema.parse(p),
);

const slugs = projects.map((p) => p.slug);
if (new Set(slugs).size !== slugs.length) {
  throw new Error(`Duplicate project slugs: ${slugs.join(', ')}`);
}

/** Projects with a repository and real work: the only ones the home page grid shows. */
export const gridProjects: Project[] = projects.filter((p) => p.status !== 'coming-soon' && p.repo);

/** Planned projects: named in one quiet line under the grid, with a detail page but no card. */
export const nextUpProjects: Project[] = projects.filter((p) => !gridProjects.includes(p));

/** The "Next up: ..." line under the project grid. */
export function nextUpLine(): string {
  const parts = nextUpProjects.map((p) => `${p.name} (${p.teaser})`);
  const joined =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? '');
  return joined ? `Next up: ${joined}.` : '';
}

/** Previous and next project for the links at the end of a case study, among grid projects. */
export function neighbours(slug: string): { previous: Project; next: Project } {
  const i = gridProjects.findIndex((p) => p.slug === slug);
  if (i === -1) return { previous: gridProjects.at(-1)!, next: gridProjects[0] };
  return {
    previous: gridProjects[(i - 1 + gridProjects.length) % gridProjects.length],
    next: gridProjects[(i + 1) % gridProjects.length],
  };
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const statusLabel: Record<Project['status'], string> = {
  live: 'Live',
  building: 'Building',
  'coming-soon': 'Coming soon',
};
