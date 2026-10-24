import type { Metadata } from 'next';
import Link from 'next/link';
import SiteShell from '@/components/SiteShell';
import { lab } from '@/lib/content';

const description =
  'Early-stage experiments, each starting from a question about data I can get hold of.';

export const metadata: Metadata = {
  title: 'Curiosity Lab',
  description,
  alternates: { canonical: '/lab' },
  openGraph: {
    title: 'Curiosity Lab · Aravind Danassegarane',
    description,
    url: '/lab',
    type: 'website',
  },
};

const stages = ['Idea', 'Building', 'Working'];

export default function Lab() {
  return (
    <SiteShell
      footer={
        <span>
          The main work is on the <Link href="/">home page</Link>.
        </span>
      }
    >
      <section className="lab-hero">
        <div className="wrap">
          <h1>Curiosity Lab</h1>
          <p>
            Early-stage experiments, each starting from a question about data I can get hold of.
            Nothing here is finished; every card shows how far it has got.
          </p>
        </div>
      </section>

      <div className="wrap">
        <div className="exp-head">
          <h2>The experiments</h2>
          <span className="mono" style={{ fontSize: 13, color: '#A9B0BC' }}>
            Idea → Building → Working
          </span>
        </div>
        <div className="exp-grid">
          {lab.experiments.map((e) => (
            <article className="exp" key={e.id}>
              <div className="card-row">
                <span className="id">{e.id}</span>
                <span className="stage-badge">{stages[e.stage - 1]}</span>
              </div>
              <h3>{e.name}</h3>
              <p className="q">{e.question}</p>
              <div className="stagebar" role="img" aria-label={`Stage: ${stages[e.stage - 1]}`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= e.stage ? 'on' : ''}></span>
                ))}
              </div>
              <div className="uses">
                <b>Uses</b>
                {e.uses}
              </div>
              <div className="tags">
                {e.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <section className="tempting" aria-labelledby="tempt-h">
          <h2 id="tempt-h">Ideas for later</h2>
          <p>Ideas I may come back to.</p>
          <ul>
            {lab.tempting.map((t) => (
              <li key={t.idea}>
                <span>{t.idea}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
