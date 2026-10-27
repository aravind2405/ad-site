import labData from '@/data/lab.json';
import profileData from '@/data/profile.json';
import shelfData from '@/data/shelf.json';
import gridwatch from '@/data/projects/gridwatch.json';
import groundtruth from '@/data/projects/groundtruth.json';
import ontimesydney from '@/data/projects/ontimesydney.json';
import rentlens from '@/data/projects/rentlens.json';
import { labSchema, profileSchema, projectSchema, shelfSchema, type Project } from './schemas';

// Every content file is validated when it is first imported, so invalid content
// fails the build (and the tests) instead of reaching visitors.
export const profile = profileSchema.parse(profileData);
export const shelf = shelfSchema.parse(shelfData);
export const lab = labSchema.parse(labData);

// Display order: live work first, then work in progress, then plans.
export const projects: Project[] = [rentlens, ontimesydney, gridwatch, groundtruth].map((p) =>
  projectSchema.parse(p),
);

const slugs = projects.map((p) => p.slug);
if (new Set(slugs).size !== slugs.length) {
  throw new Error(`Duplicate project slugs: ${slugs.join(', ')}`);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const statusLabel: Record<Project['status'], string> = {
  live: 'Live',
  building: 'Building',
  'coming-soon': 'Coming soon',
};
