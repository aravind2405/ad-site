import type { Project } from './schemas';

const WORDS_PER_MINUTE = 238;
// Keys whose values are links or identifiers rather than text a reader reads.
const SKIP = new Set(['licenceLink', 'href', 'slug', 'repo', 'live', 'verified', 'status']);

function words(value: unknown): number {
  if (typeof value === 'string') return value.trim().split(/\s+/).filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce<number>((n, v) => n + words(v), 0);
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((n, [k, v]) => (SKIP.has(k) ? n : n + words(v)), 0);
  }
  return 0;
}

/** Whole minutes to read a project page, at 238 words a minute, never less than 1. */
export function readingMinutes(project: Project): number {
  const total = words({
    question: project.question,
    summary: project.summary,
    details: project.details,
  });
  return Math.max(1, Math.ceil(total / WORDS_PER_MINUTE));
}
