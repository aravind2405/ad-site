/**
 * Rules for the contact form, shared by the form (to help people fix mistakes) and the server (which
 * decides). Plain functions, so no validation library is shipped to the browser.
 */
export const LIMITS = {
  name: 100,
  email: 254,
  message: 2000,
  minMessage: 10,
  body: 10_000,
} as const;

export type ContactField = 'name' | 'email' | 'message';
export type FieldErrors = Partial<Record<ContactField, string>>;
export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

// Deliberately simple: one @, no spaces, a dot in the domain. A real address is proven by a reply.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(
  input: unknown,
): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const text = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string).trim() : '');
  const data: ContactInput = { name: text('name'), email: text('email'), message: text('message') };
  const errors: FieldErrors = {};

  if (data.name.length === 0) errors.name = 'Please tell me your name.';
  else if (data.name.length > LIMITS.name) {
    errors.name = `Please keep your name under ${LIMITS.name} characters.`;
  }

  if (data.email.length > LIMITS.email) errors.email = 'That email address is too long.';
  else if (!EMAIL.test(data.email)) errors.email = 'Please enter a valid email address.';

  if (data.message.length < LIMITS.minMessage) {
    errors.message = `Please write at least a sentence (${LIMITS.minMessage} characters).`;
  } else if (data.message.length > LIMITS.message) {
    errors.message = `Please keep your message under ${LIMITS.message} characters.`;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}
