import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import shelfData from '@/data/shelf.json';
import type { ShelfItem } from '@/lib/types';

const description = "What I'm reading, and what stuck.";

export const metadata: Metadata = {
  title: 'The shelf · Aravind Danassegarane',
  description,
  alternates: { canonical: '/shelf' },
  openGraph: { title: 'The shelf · Aravind Danassegarane', description, url: '/shelf', type: 'website' },
};

const shelf: ShelfItem[] = shelfData as ShelfItem[];

const columns: {
  key: ShelfItem['status'];
  title: string;
  dot: string;
  ring?: boolean;
  field: 'why' | 'stuck';
  label: string;
}[] = [
  { key: 'reading', title: 'Reading now', dot: '#6A55B0', field: 'why', label: 'Why' },
  { key: 'next', title: 'Up next', dot: 'transparent', ring: true, field: 'why', label: 'Why' },
  { key: 'done', title: 'Finished', dot: '#1F7A4D', field: 'stuck', label: 'What stuck' },
];

export default function Shelf() {
  return (
    <div className="wrap">
      <section className="page-head">
        <h1>The shelf</h1>
        <p>Books, papers, talks and courses shaping how I think, with what I took from each and where it ended up in my work.</p>
      </section>

      <section className="shelf-cols">
        {columns.map((c) => {
          const items = shelf.filter((s) => s.status === c.key);
          const dotStyle: CSSProperties = c.ring ? { border: '2px solid #7A8090' } : { background: c.dot };
          return (
            <div key={c.key}>
              <h2>
                <span className="dot" aria-hidden="true" style={dotStyle}></span>
                {c.title}
              </h2>
              {items.length === 0 && <p className="empty">Nothing here yet.</p>}
              {items.map((s) => (
                <article className="card shelf-item" key={s.title}>
                  <span className="mono muted" style={{ fontSize: 12 }}>{s.kind}</span>
                  <h3 style={{ margin: 0 }}>{s.title}</h3>
                  <span className="muted" style={{ fontSize: 14 }}>{s.by}</span>
                  {s[c.field] && <p>{c.label}: {s[c.field]}</p>}
                  {s.related && (
                    <span className="muted" style={{ fontSize: 13 }}>For: <Link href={s.related.href}>{s.related.name}</Link></span>
                  )}
                </article>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
