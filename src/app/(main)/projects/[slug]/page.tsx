import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusPill from '@/components/StatusPill';
import { getProject, projects } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { getRepoMeta } from '@/lib/github';

// Repository activity is read live from GitHub and refreshed hourly.
export const revalidate = 3600;
export const dynamicParams = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const title = `${project.name} · Aravind Danassegarane`;
  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { title, description: project.summary, url: `/projects/${slug}`, type: 'article' },
  };
}

const ciText = { passing: 'Passing', failing: 'Failing', running: 'Running', unknown: 'No result' };

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { details: d } = project;
  const meta = project.repo ? await getRepoMeta(project.repo) : null;
  const repoUrl = project.repo ? `https://github.com/${project.repo}` : null;

  return (
    <div className="wrap">
      <Link className="crumb" href="/#projects">
        ← All projects
      </Link>

      <header className="detail-head">
        <div className="title-row">
          <span className="name">{project.name}</span>
          <StatusPill status={project.status} />
        </div>
        <h1>{project.question}</h1>
        <p className="lede">{project.summary}</p>
        <ul
          className="tags"
          aria-label="Technology"
          style={{ margin: 0, padding: 0, listStyle: 'none' }}
        >
          {project.stack.map((t) => (
            <li className="tag" key={t}>
              {t}
            </li>
          ))}
          {project.plannedStack.map((t) => (
            <li className="tag tag-planned" key={t}>
              {t} (planned)
            </li>
          ))}
        </ul>
        {(repoUrl || project.live) && (
          <div className="detail-actions">
            {project.live && (
              <a
                className="btn btn-primary"
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open {project.liveLabel?.toLowerCase() ?? 'live demo'}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {repoUrl && (
              <a className="btn btn-ghost" href={repoUrl} target="_blank" rel="noopener noreferrer">
                View code on GitHub<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </header>

      <p className="callout">{d.statusNote}</p>

      <section className="detail-section prose" aria-labelledby="overview-h">
        <h2 id="overview-h">Overview</h2>
        {d.overview.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </section>

      {d.willCover.length > 0 && (
        <section className="detail-section" aria-labelledby="cover-h">
          <h2 id="cover-h">What it will cover</h2>
          <ul className="bullets">
            {d.willCover.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {d.architecture && (
        <section className="detail-section" aria-labelledby="arch-h">
          <h2 id="arch-h">Architecture</h2>
          <p
            className="prose"
            style={{
              margin: 0,
              maxWidth: 720,
              fontSize: 17,
              lineHeight: 1.7,
              color: 'var(--ink-2)',
            }}
          >
            {d.architecture.summary}
          </p>
          <ol className="flow" aria-label="Data flow">
            {d.architecture.steps.map((step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {project.live && project.status === 'live' && (
        <section className="detail-section" aria-labelledby="live-h">
          <h2 id="live-h">{project.liveLabel ?? 'Live demo'}</h2>
          <iframe
            className="dash"
            src={project.live}
            title={`${project.name} ${project.liveLabel?.toLowerCase() ?? 'live demo'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts"
          />
          {d.data && (
            <p className="credit">
              Data: {d.data.source}
              {d.data.copyright ? `, ${d.data.copyright}` : ''}, licensed under{' '}
              {d.data.licenceLink ? (
                <a href={d.data.licenceLink} target="_blank" rel="noopener noreferrer">
                  {d.data.licence}
                </a>
              ) : (
                d.data.licence
              )}
              .{d.data.note ? ` ${d.data.note}` : ''}
            </p>
          )}
        </section>
      )}

      {d.decisions.length > 0 && (
        <section className="detail-section" aria-labelledby="dec-h">
          <h2 id="dec-h">Design decisions</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {d.decisions.map((dec) => (
              <div className="decision" key={dec.title}>
                <h3>{dec.title}</h3>
                <p>{dec.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.practices.length > 0 && (
        <section className="detail-section" aria-labelledby="prac-h">
          <h2 id="prac-h">How it is built and checked</h2>
          <ul className="bullets">
            {d.practices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {d.data && !(project.live && project.status === 'live') && (
        <section className="detail-section" aria-labelledby="data-h">
          <h2 id="data-h">Data source and licence</h2>
          <dl className="facts">
            <div>
              <dt>Source</dt>
              <dd>{d.data.source}</dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>{d.data.licence}</dd>
            </div>
          </dl>
        </section>
      )}

      {d.roadmap.length > 0 && (
        <section className="detail-section" aria-labelledby="road-h">
          <h2 id="road-h">Roadmap</h2>
          <ul className="bullets">
            {d.roadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {d.limitations.length > 0 && (
        <section className="detail-section" aria-labelledby="lim-h">
          <h2 id="lim-h">Known limitations</h2>
          <ul className="bullets">
            {d.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {meta && (
        <section className="detail-section" aria-labelledby="repo-h">
          <h2 id="repo-h">Repository activity</h2>
          <dl className="facts">
            <div>
              <dt>Last push</dt>
              <dd>{formatDate(meta.pushedAt)}</dd>
            </div>
            {meta.license && (
              <div>
                <dt>Licence</dt>
                <dd>{meta.license}</dd>
              </div>
            )}
            {meta.ci && (
              <div>
                <dt>Latest CI run</dt>
                <dd>
                  <a href={meta.ci.url} target="_blank" rel="noopener noreferrer">
                    {ciText[meta.ci.state]}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <p className="provenance">
        Content checked against {project.verified.against} on {formatDate(project.verified.date)}.
        {meta ? ' Repository activity is read live from GitHub and refreshed hourly.' : ''}
      </p>
    </div>
  );
}
