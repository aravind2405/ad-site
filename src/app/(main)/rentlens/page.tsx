import type { Metadata } from 'next';
import Link from 'next/link';
import StatusPill from '@/components/StatusPill';
import projectsData from '@/data/projects.json';
import type { Project } from '@/lib/types';

const p = (projectsData as Project[]).find((x) => x.slug === 'rentlens')!;

export const metadata: Metadata = {
  title: 'RentLens NSW · Aravind Danassegarane',
  description: p.summary,
  openGraph: { title: 'RentLens NSW · Aravind Danassegarane', description: p.summary },
};

export default function RentLens() {
  return (
    <div className="wrap section">
      <p className="mono muted" style={{ fontSize: 13, margin: '32px 0 8px' }}><Link href="/#projects">← All projects</Link></p>
      <div className="card-row" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <h1 className="h2">{p.name}</h1>
        <StatusPill status={p.status} />
      </div>
      <p className="lede">{p.question} {p.summary}</p>
      <div className="tags" style={{ marginTop: 16 }}>{p.tags?.map((t) => <span className="tag" key={t}>{t}</span>)}</div>

      <div className="actions" style={{ marginTop: 20 }}>
        {p.live && <a className="btn btn-primary" href={p.live}>Open full dashboard</a>}
        {p.code && <a className="btn btn-ghost" href={p.code}>View code on GitHub</a>}
      </div>

      <section aria-labelledby="why-h" style={{ marginTop: 40 }}>
        <h2 id="why-h" className="h2-sm">Why it exists</h2>
        <p className="lede">Listing sites show what landlords are asking. NSW Fair Trading records what tenants actually signed, through rental bond lodgements. RentLens turns those official records into median weekly rents by dwelling type, postcode and month.</p>
      </section>

      <section aria-labelledby="dash-h" style={{ marginTop: 40 }}>
        <h2 id="dash-h" className="h2-sm">Live dashboard</h2>
        {p.live && (
          <iframe
            className="dash"
            src={p.live}
            title="RentLens NSW live dashboard"
            loading="lazy"
            referrerPolicy="no-referrer"
          ></iframe>
        )}
        <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>Data: NSW Fair Trading rental bond lodgements, published as open data by the NSW Government. The analysis is my own and is not an official NSW Government statistic.</p>
      </section>
    </div>
  );
}
