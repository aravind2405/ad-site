import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/components/Button';
import Diagram from '@/components/Diagram';
import JsonLd from '@/components/JsonLd';
import Receipt from '@/components/Receipt';
import StatusPill from '@/components/StatusPill';
import { getProject, neighbours, profile, projects } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { getDiagram } from '@/lib/diagrams';
import { getRepoMeta } from '@/lib/github';
import { SITE_URL } from '@/lib/site';

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
  const isLive = Boolean(project.live && project.status === 'live');
  const comingSoon = project.status === 'coming-soon';
  const heading = d.headings ?? {};
  const { previous, next } = neighbours(project.slug);
  const diagram = getDiagram(project.slug);

  const structured =
    d.decisions.length > 0 && d.decisions.every((x) => x.chose && x.rejected && x.why);
  const proof = [
    { id: 'prac-h', title: heading.verify ?? 'How I know it works', items: d.practices },
    { id: 'lim-h', title: 'Known limitations', items: d.limitations },
    { id: 'road-h', title: heading.next ?? "What's next", items: d.roadmap },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      {repoUrl && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: project.name,
            description: project.summary,
            url: `${SITE_URL}/projects/${project.slug}`,
            codeRepository: repoUrl,
            author: { '@type': 'Person', name: profile.name },
          }}
        />
      )}

      <div className="tone tone-hero">
        <div className="wrap">
          <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
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
              </ul>
              <Receipt receipt={project.receipt} />
              {(repoUrl || project.live) && (
                <div className="detail-actions">
                  {project.live && (
                    <Button href={project.live} external arrow>
                      Open {project.liveLabel?.toLowerCase() ?? 'live demo'}
                    </Button>
                  )}
                  {repoUrl && (
                    <Button href={repoUrl} variant="ghost" external>
                      View code on GitHub
                    </Button>
                  )}
                </div>
              )}
            </header>
          </ViewTransition>
        </div>
      </div>

      <section className="tone tone-white" aria-labelledby="thirty-h">
        <div className="wrap">
          <h2 id="thirty-h" className="sr-only">
            In 30 seconds
          </h2>
          <dl className="glance">
            <div>
              <dt>The problem</dt>
              <dd>{d.overview[0]}</dd>
            </div>
            {d.overview[1] && (
              <div>
                <dt>{comingSoon ? 'What I will build' : 'What I built'}</dt>
                <dd>{d.overview[1]}</dd>
              </div>
            )}
            <div>
              <dt>Where it stands</dt>
              <dd className="stands">{d.statusNote}</dd>
            </div>
          </dl>
          {d.overview.slice(2).map((para) => (
            <p className="prose-p" key={para}>
              {para}
            </p>
          ))}
        </div>
      </section>

      {isLive && project.live && (
        <section className="tone tone-mist" aria-labelledby="live-h">
          <div className="wrap reveal">
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
          </div>
        </section>
      )}

      {d.willCover.length > 0 && (
        <section className="tone tone-mist" aria-labelledby="cover-h">
          <div className="wrap reveal">
            <h2 id="cover-h">What it will cover</h2>
            <ul className="bullets">
              {d.willCover.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="soon">Case study coming soon.</p>
          </div>
        </section>
      )}

      {d.architecture && (
        <section className="tone tone-white" aria-labelledby="arch-h">
          <div className="wrap reveal">
            <h2 id="arch-h">{heading.how ?? 'How it works'}</h2>
            <p className="prose-p">{d.architecture.summary}</p>
            {diagram && (
              <Diagram
                definition={diagram}
                label={`Data flow for ${project.name}: ${d.architecture.steps.join(', then ')}.`}
              />
            )}
            <ol className="flow" aria-label="Data flow">
              {d.architecture.steps.map((step) => (
                <li key={step}>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {d.decisions.length > 0 && (
        <section className="tone tone-hero" aria-labelledby="dec-h">
          <div className="wrap reveal">
            <h2 id="dec-h">{heading.decisions ?? 'Decisions and trade-offs'}</h2>
            {structured ? (
              <div className="table-wrap">
                <table className="tradeoffs">
                  <thead>
                    <tr>
                      <th scope="col">Decision</th>
                      <th scope="col">What I chose</th>
                      <th scope="col">What I did not</th>
                      <th scope="col">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.decisions.map((dec) => (
                      <tr key={dec.title}>
                        <th scope="row">{dec.title}</th>
                        <td data-label="What I chose">{dec.chose}</td>
                        <td data-label="What I did not">{dec.rejected}</td>
                        <td data-label="Why">{dec.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="decisions">
                {d.decisions.map((dec) => (
                  <div className="decision" key={dec.title}>
                    <h3>{dec.title}</h3>
                    <p>{dec.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {proof.length > 0 && (
        <section className="tone tone-white" aria-label="Proof, limits and next steps">
          <div className="wrap reveal">
            <div className="proof">
              {proof.map((group) => (
                <div key={group.id}>
                  <h2 id={group.id}>{group.title}</h2>
                  <ul className="bullets" aria-labelledby={group.id}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="tone tone-mist" aria-label="Project details">
        <div className="wrap reveal">
          {(meta || (d.data && !isLive)) && (
            <dl className="facts">
              {d.data && !isLive && (
                <>
                  <div>
                    <dt>Data source</dt>
                    <dd>{d.data.source}</dd>
                  </div>
                  <div>
                    <dt>Data licence</dt>
                    <dd>{d.data.licence}</dd>
                  </div>
                </>
              )}
              {meta && (
                <>
                  <div>
                    <dt>Last push</dt>
                    <dd>{formatDate(meta.pushedAt)}</dd>
                  </div>
                  {meta.license && (
                    <div>
                      <dt>Code licence</dt>
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
                </>
              )}
            </dl>
          )}

          <nav className="exits" aria-label="More projects">
            <Link href={`/projects/${previous.slug}`}>
              <span className="exit-label">Previous project</span>
              <span className="exit-title">{previous.name}</span>
            </Link>
            <Link className="exit-next" href={`/projects/${next.slug}`}>
              <span className="exit-label">Next project</span>
              <span className="exit-title">{next.name} →</span>
            </Link>
          </nav>

          <p className="provenance">
            Content checked against {project.verified.against} on{' '}
            {formatDate(project.verified.date)}.
            {meta ? ' Repository activity is read live from GitHub and refreshed hourly.' : ''}
          </p>
        </div>
      </section>
    </>
  );
}
