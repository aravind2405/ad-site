'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ShelfItem } from '@/lib/schemas';

type StatusFilter = 'all' | ShelfItem['status'];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reading', label: 'Reading now' },
  { value: 'next', label: 'Up next' },
  { value: 'done', label: 'Finished' },
];

const statusText: Record<ShelfItem['status'], string> = {
  reading: 'Reading now',
  next: 'Up next',
  done: 'Finished',
};

export default function ShelfBrowser({ items }: { items: ShelfItem[] }) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [kind, setKind] = useState<string>('all');

  const kinds = useMemo(() => [...new Set(items.map((i) => i.kind))].sort(), [items]);
  const visible = items.filter(
    (i) => (status === 'all' || i.status === status) && (kind === 'all' || i.kind === kind),
  );

  return (
    <>
      <div className="toolbar" role="group" aria-label="Filter the shelf">
        <div className="group" role="group" aria-label="Status">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              className="chip-btn"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="divider" aria-hidden="true" />
        <div className="group" role="group" aria-label="Type">
          {['all', ...kinds].map((k) => (
            <button
              key={k}
              type="button"
              className="chip-btn"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {k === 'all' ? 'All types' : k}
            </button>
          ))}
        </div>
        <span className="shelf-count" aria-live="polite">
          {visible.length} of {items.length}
        </span>
      </div>

      <div className="shelf-grid">
        {visible.length === 0 && <p className="empty">Nothing matches those filters yet.</p>}
        {visible.map((item) => (
          <article className="card shelf-card" key={item.title}>
            <div className="card-row">
              <span className="status-dot" data-status={item.status}>
                {statusText[item.status]}
              </span>
              <span className="tag">{item.kind}</span>
            </div>
            <h2>{item.title}</h2>
            <span className="by">{item.by}</span>
            {item.why && <p>Why: {item.why}</p>}
            {item.stuck && <p>What stuck: {item.stuck}</p>}
            {item.related && (
              <span className="for">
                For: <Link href={item.related.href}>{item.related.name}</Link>
              </span>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
