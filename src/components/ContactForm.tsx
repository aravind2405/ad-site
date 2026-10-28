'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { LIMITS, validateContact } from '@/lib/contact';
import type { ContactField, FieldErrors } from '@/lib/contact';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const fields: { name: ContactField; label: string; type: string; autoComplete: string }[] = [
  { name: 'name', label: 'Your name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Your email', type: 'email', autoComplete: 'email' },
];

/**
 * Sends a message to the site's own /api/contact route, which forwards it by email. The visitor's
 * address goes only to that route; no email address of mine is in this page.
 */
export default function ContactForm() {
  // False while the page is rendered on the server and until it has loaded in the browser, so the
  // form never shows in a page where it could not work.
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'sent') done.current?.focus();
  }, [status]);

  const focusFirst = (found: FieldErrors) => {
    const first = (['name', 'email', 'message'] as const).find((f) => found[f]);
    if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const checked = validateContact(data);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus('idle');
      focusFirst(checked.errors);
      return;
    }
    setErrors({});
    setFailure('');
    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checked.data, website: data.website ?? '' }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: FieldErrors;
      };
      if (response.ok && body.ok) {
        setStatus('sent');
        return;
      }
      if (response.status === 400 && body.errors) {
        setErrors(body.errors);
        setStatus('idle');
        focusFirst(body.errors);
        return;
      }
      setFailure(body.error ?? 'Your message could not be sent. Please try LinkedIn instead.');
      setStatus('error');
    } catch {
      setFailure('Could not reach the site. Check your connection, or use LinkedIn instead.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-done" role="status" tabIndex={-1} ref={done}>
        <h3>Thanks, your message is sent.</h3>
        <p>I will reply to the email address you gave.</p>
      </div>
    );
  }

  return (
    <>
      <noscript>
        <p className="form-note">The message form needs JavaScript. Please use LinkedIn instead.</p>
      </noscript>
      <form
        ref={form}
        className="contact-form"
        onSubmit={onSubmit}
        noValidate
        hidden={!ready}
        aria-label="Send me a message"
      >
        {fields.map((f) => (
          <div className="field" key={f.name}>
            <label htmlFor={`contact-${f.name}`}>{f.label}</label>
            <input
              id={`contact-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              maxLength={f.name === 'name' ? LIMITS.name : LIMITS.email}
              aria-invalid={errors[f.name] ? true : undefined}
              aria-describedby={errors[f.name] ? `contact-${f.name}-error` : undefined}
              required
            />
            {errors[f.name] && (
              <p className="field-error" id={`contact-${f.name}-error`}>
                {errors[f.name]}
              </p>
            )}
          </div>
        ))}
        <div className="field">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            maxLength={LIMITS.message}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            required
          />
          {errors.message && (
            <p className="field-error" id="contact-message-error">
              {errors.message}
            </p>
          )}
        </div>
        {/* A trap for bots: people never see or reach it. Anything typed here means a bot. */}
        <div className="field-trap" aria-hidden="true">
          <label htmlFor="contact-website">Leave this empty</label>
          <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {status === 'error' && (
          <p className="form-error" role="alert">
            {failure}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </>
  );
}
