import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ciState, getRepoMeta } from './github';

const repoBody = {
  description: 'A repo',
  pushed_at: '2026-10-24T00:38:42Z',
  html_url: 'https://github.com/aravind2405/rentlens-nsw',
  license: { spdx_id: 'MIT' },
  topics: ['dbt'],
};
const runsBody = {
  workflow_runs: [
    {
      status: 'completed',
      conclusion: 'success',
      html_url: 'https://github.com/aravind2405/rentlens-nsw/actions/runs/1',
      updated_at: '2026-10-24T00:40:00Z',
    },
  ],
};

function respond(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe('getRepoMeta', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns repository facts and the latest CI result', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respond(repoBody))
      .mockResolvedValueOnce(respond(runsBody));
    const meta = await getRepoMeta('aravind2405/rentlens-nsw');
    expect(meta).toMatchObject({ license: 'MIT', pushedAt: '2026-10-24T00:38:42Z' });
    expect(meta?.ci?.state).toBe('passing');
  });

  it('returns null when GitHub answers with an error (for example a rate limit)', async () => {
    vi.mocked(fetch).mockResolvedValue(respond({ message: 'rate limited' }, false));
    expect(await getRepoMeta('aravind2405/rentlens-nsw')).toBeNull();
  });

  it('returns null when the network fails or times out', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    expect(await getRepoMeta('aravind2405/rentlens-nsw')).toBeNull();
  });

  it('returns null when the response has an unexpected shape', async () => {
    vi.mocked(fetch).mockResolvedValue(respond({ unexpected: true }));
    expect(await getRepoMeta('aravind2405/rentlens-nsw')).toBeNull();
  });

  it('still returns repository facts when the CI lookup fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respond(repoBody))
      .mockResolvedValueOnce(respond({}, false));
    const meta = await getRepoMeta('aravind2405/rentlens-nsw');
    expect(meta?.ci).toBeNull();
    expect(meta?.url).toContain('github.com');
  });

  it('sends a token only when one is configured', async () => {
    // The environment may already provide a token (CI does), so control it explicitly.
    vi.stubEnv('GITHUB_TOKEN', '');
    vi.mocked(fetch).mockResolvedValue(respond({}, false));
    await getRepoMeta('a/b');
    const without = (vi.mocked(fetch).mock.calls[0][1]?.headers ?? {}) as Record<string, string>;
    expect(without.Authorization).toBeUndefined();

    vi.stubEnv('GITHUB_TOKEN', 'test-token');
    vi.mocked(fetch).mockClear();
    await getRepoMeta('a/b');
    const withToken = (vi.mocked(fetch).mock.calls[0][1]?.headers ?? {}) as Record<string, string>;
    expect(withToken.Authorization).toBe('Bearer test-token');
  });
});

describe('ciState', () => {
  it('maps workflow runs to a display state', () => {
    expect(ciState({ status: 'completed', conclusion: 'success' })).toBe('passing');
    expect(ciState({ status: 'completed', conclusion: 'failure' })).toBe('failing');
    expect(ciState({ status: 'completed', conclusion: 'timed_out' })).toBe('failing');
    expect(ciState({ status: 'in_progress', conclusion: null })).toBe('running');
    expect(ciState({ status: 'completed', conclusion: 'cancelled' })).toBe('unknown');
  });
});
