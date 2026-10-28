import { LIMITS, validateContact } from '@/lib/contact';
import { contactLimiter } from '@/lib/contactLimiter';

const SEND_TIMEOUT_MS = 8000;
const DEFAULT_FROM = 'Portfolio contact <onboarding@resend.dev>';

function reply(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function visitorAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Receives the contact form and forwards it by email. The destination address and the API key live
 * only in environment variables (see .env.example); they are never written in code or sent to the
 * browser. The visitor's message and address are not logged.
 */
export async function POST(request: Request) {
  // Only this site's own pages may post here.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return reply({ ok: false, error: 'This request is not allowed.' }, 403);
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return reply({ ok: false, error: 'Please send JSON.' }, 415);
  }

  const raw = await request.text();
  if (raw.length > LIMITS.body) {
    return reply({ ok: false, error: 'That message is too large.' }, 413);
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return reply({ ok: false, error: 'That request could not be read.' }, 400);
  }

  // The honeypot field is hidden from people. If it has anything in it, a bot filled the form:
  // answer as if it worked, and send nothing.
  const trap = (data as { website?: unknown } | null)?.website;
  if (typeof trap === 'string' && trap.length > 0) return reply({ ok: true }, 200);

  const parsed = validateContact(data);
  if (!parsed.ok) {
    return reply(
      {
        ok: false,
        error: 'Please check the highlighted fields.',
        errors: parsed.errors,
      },
      400,
    );
  }

  const limit = contactLimiter.check(visitorAddress(request));
  if (!limit.ok) {
    return reply(
      {
        ok: false,
        error: 'You have sent several messages recently. Please try again later, or use LinkedIn.',
      },
      429,
      { 'Retry-After': String(limit.retryAfterSeconds) },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error('Contact form is not configured: RESEND_API_KEY or CONTACT_TO_EMAIL is missing.');
    return reply(
      { ok: false, error: 'The contact form is not available right now. Please use LinkedIn.' },
      503,
    );
  }

  const { name, email, message } = parsed.data;
  const oneLine = (text: string) => text.replace(/[\r\n]+/g, ' ');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        reply_to: email,
        subject: `Message from ${oneLine(name)} via the portfolio site`,
        text: `Name: ${oneLine(name)}\nEmail: ${email}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`Contact email service answered with status ${response.status}.`);
      return reply(
        { ok: false, error: 'Your message could not be sent. Please try LinkedIn instead.' },
        502,
      );
    }
  } catch (error) {
    console.error(
      `Contact email service call failed: ${error instanceof Error ? error.name : 'unknown'}.`,
    );
    return reply(
      { ok: false, error: 'Your message could not be sent. Please try LinkedIn instead.' },
      502,
    );
  }

  return reply({ ok: true }, 200);
}
