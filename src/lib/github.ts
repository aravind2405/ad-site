import { z } from 'zod';

const API = 'https://api.github.com';
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 5000;

const repoResponse = z.object({
  description: z.string().nullable(),
  pushed_at: z.string(),
  html_url: z.url(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  topics: z.array(z.string()).optional(),
});

const runsResponse = z.object({
  workflow_runs: z.array(
    z.object({
      status: z.string().nullable(),
      conclusion: z.string().nullable(),
      html_url: z.url(),
      updated_at: z.string(),
    }),
  ),
});

export interface RepoMeta {
  url: string;
  description: string | null;
  license: string | null;
  topics: string[];
  pushedAt: string;
  ci: {
    state: 'passing' | 'failing' | 'running' | 'unknown';
    url: string;
    updatedAt: string;
  } | null;
}

function headers(): HeadersInit {
  const base: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aravindd.com-build',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  // Optional: a read-only token raises the unauthenticated rate limit (60 requests/hour).
  if (process.env.GITHUB_TOKEN) base.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return base;
}

async function getJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: headers(),
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function ciState(run: {
  status: string | null;
  conclusion: string | null;
}): NonNullable<RepoMeta['ci']>['state'] {
  if (run.status && run.status !== 'completed') return 'running';
  if (run.conclusion === 'success') return 'passing';
  if (run.conclusion === 'failure' || run.conclusion === 'timed_out') return 'failing';
  return 'unknown';
}

/**
 * Live repository facts from GitHub. Returns null on any failure (network, rate limit,
 * unexpected shape) so pages render without the live block instead of breaking.
 */
export async function getRepoMeta(repo: string): Promise<RepoMeta | null> {
  const parsedRepo = repoResponse.safeParse(await getJson(`/repos/${repo}`));
  if (!parsedRepo.success) return null;
  const r = parsedRepo.data;

  const parsedRuns = runsResponse.safeParse(
    await getJson(`/repos/${repo}/actions/runs?per_page=1&branch=main`),
  );
  const run = parsedRuns.success ? parsedRuns.data.workflow_runs[0] : undefined;

  return {
    url: r.html_url,
    description: r.description,
    license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
    topics: r.topics ?? [],
    pushedAt: r.pushed_at,
    ci: run ? { state: ciState(run), url: run.html_url, updatedAt: run.updated_at } : null,
  };
}
