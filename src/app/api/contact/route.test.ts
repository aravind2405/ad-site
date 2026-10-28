import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contactLimiter } from '@/lib/contactLimiter';
import { POST } from './route';

const valid = {
  name: 'Sam Recruiter',
  email: 'sam@example.org',
  message: 'Hi Aravind, we have a graduate data engineer role. Are you free to talk?',
};

let counter = 0;
function post(body: unknown, init: { headers?: Record<string, string>; raw?: string } = {}) {
  counter += 1;
  return POST(
    new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `203.0.113.${counter}`,
        ...init.headers,
      },
      body: init.raw ?? JSON.stringify(body),
    }),
  );
}

const fetchMock = vi.fn();

beforeEach(() => {
  contactLimiter.reset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('{"id":"x"}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('RESEND_API_KEY', 'test-key-not-real');
  vi.stubEnv('CONTACT_TO_EMAIL', 'inbox@example.test');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/contact', () => {
  it('sends a valid message and answers ok', async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer test-key-not-real');
    const sent = JSON.parse(init.body);
    expect(sent.to).toEqual(['inbox@example.test']);
    expect(sent.reply_to).toBe('sam@example.org');
    expect(sent.text).toContain('graduate data engineer role');
  });

  it('keeps a line break in the name out of the email subject', async () => {
    await post({ ...valid, name: 'Sam\r\nBcc: someone@example.org' });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.subject).not.toMatch(/[\r\n]/);
  });

  it('rejects missing fields with a message for each', async () => {
    const res = await post({ name: '', email: '', message: '' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors).sort()).toEqual(['email', 'message', 'name']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid email and a too-short message', async () => {
    const res = await post({ ...valid, email: 'not-an-email', message: 'short' });
    expect(res.status).toBe(400);
    const { errors } = await res.json();
    expect(errors.email).toMatch(/valid email/i);
    expect(errors.message).toMatch(/10 characters/);
    expect(errors.name).toBeUndefined();
  });

  it('rejects an over-long message and an oversized body', async () => {
    const long = await post({ ...valid, message: 'x'.repeat(2001) });
    expect(long.status).toBe(400);
    expect((await long.json()).errors.message).toMatch(/under 2000/);
    const huge = await post(null, {
      raw: JSON.stringify({ ...valid, message: 'y'.repeat(20_000) }),
    });
    expect(huge.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers ok but sends nothing when the hidden field is filled', async () => {
    const res = await post({ ...valid, website: 'https://spam.example' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a request that is not JSON, not readable, or from another site', async () => {
    expect((await post(valid, { headers: { 'content-type': 'text/plain' } })).status).toBe(415);
    expect((await post(null, { raw: '{not json' })).status).toBe(400);
    expect((await post(valid, { headers: { origin: 'https://evil.example' } })).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limits one visitor to five messages an hour', async () => {
    const same = { 'x-forwarded-for': '198.51.100.7' };
    for (let i = 0; i < 5; i += 1) {
      expect((await post(valid, { headers: same })).status).toBe(200);
    }
    const res = await post(valid, { headers: same });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    // Another visitor is not affected.
    expect((await post(valid, { headers: { 'x-forwarded-for': '198.51.100.8' } })).status).toBe(
      200,
    );
  });

  it('returns a safe error, without details, when the email service fails', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"secret internal detail"}', { status: 500 }),
    );
    const res = await post(valid);
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toContain('secret internal detail');
    expect(text).not.toContain('test-key-not-real');
    expect(JSON.parse(text).error).toMatch(/LinkedIn/);
  });

  it('returns a safe error when the email service cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:443'));
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain('ECONNREFUSED');
  });

  it('says it is unavailable, rather than failing silently, when it is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never puts the sender, key or destination in the response', async () => {
    const res = await post(valid);
    const text = await res.text();
    for (const secret of ['sam@example.org', 'test-key-not-real', 'inbox@example.test']) {
      expect(text).not.toContain(secret);
    }
  });
});
