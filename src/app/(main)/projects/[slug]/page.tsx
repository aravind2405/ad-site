import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/components/Button';
import Diagram from '@/components/Diagram';
import JsonLd from '@/components/JsonLd';
import Receipt from '@/components/Receipt';
import StatusPill from '@/components/StatusPill';
import { getProject, profile, projects } from '@/lib/content';
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
  const index = projects.findIndex((p) => p.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const diagram = getDiagram(project.slug);

  const structured =
    d.decisions.length > 0 && d.decisions.every((x) => x.chose && x.rejected && x.why);

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
                {project.plannedStack.map((t) => (
                  <li className="tag tag-planned" key={t}>
                    {t} (planned)
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

      <section id="problem" className="tone tone-white" aria-labelledby="problem-h">
        <div className="wrap">
          <h2 id="problem-h">Problem</h2>
          <p className="problem-lead">{d.overview[0]}</p>
          <dl className="glance glance-2">
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
          {d.willCover.length > 0 && (
            <>
              <h3 className="sub-h">What it will cover</h3>
              <ul className="bullets">
                {d.willCover.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="soon">Case study coming soon.</p>
            </>
          )}
        </div>
      </section>

      {d.architecture && (
        <section id="architecture" className="tone tone-mist" aria-labelledby="arch-h">
          <div className="wrap reveal">
            <h2 id="arch-h">Architecture</h2>
            {heading.how && <p className="section-point">{heading.how}</p>}
            <p className="prose-p">{d.architecture.summary}</p>
            {d.architecture.planned && (
              <p className="planned-note">
                This is the design, not a running system: no data flows through it yet.
              </p>
            )}
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

      {!comingSoon && (
        <section id="decisions" className="tone tone-hero" aria-labelledby="dec-h">
          <div className="wrap reveal">
            <h2 id="dec-h">Key decisions</h2>
            {heading.decisions && <p className="section-point">{heading.decisions}</p>}
            {d.decisions.length === 0 ? (
              <p className="none-yet">No decisions are written up yet.</p>
            ) : structured ? (
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
            {repoUrl && project.adrs.length > 0 && (
              <>
                <h3 className="sub-h">Decision records in the repo</h3>
                <ul className="adr-links">
                  {project.adrs.map((adr) => (
                    <li key={adr.file}>
                      <a
                        href={`${repoUrl}/blob/main/docs/decisions/${adr.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {adr.title}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {!comingSoon && (
        <section id="evidence" className="tone tone-white" aria-labelledby="evidence-h">
          <div className="wrap reveal">
            <h2 id="evidence-h">Evidence</h2>
            {heading.verify && <p className="section-point">{heading.verify}</p>}
            <dl className="facts">
              {repoUrl && (
                <div>
                  <dt>Repository</dt>
                  <dd>
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      {project.repo}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
              {meta?.ci && (
                <div>
                  <dt>Tests and CI</dt>
                  <dd>
                    <a href={meta.ci.url} target="_blank" rel="noopener noreferrer">
                      Latest run: {ciText[meta.ci.state].toLowerCase()}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
              {project.live && (
                <div>
                  <dt>Live demo</dt>
                  <dd>
                    <a href={project.live} target="_blank" rel="noopener noreferrer">
                      {project.liveLabel ?? 'Live demo'}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
              {meta && (
                <div>
                  <dt>Last push</dt>
                  <dd>{formatDate(meta.pushedAt)}</dd>
                </div>
              )}
              {meta?.license && (
                <div>
                  <dt>Code licence</dt>
                  <dd>{meta.license}</dd>
                </div>
              )}
              {d.data && (
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
            </dl>
            {d.practices.length > 0 && (
              <>
                <h3 className="sub-h">How it is checked</h3>
                <ul className="bullets">
                  {d.practices.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {isLive && project.live && (
              <>
                <h3 className="sub-h">{project.liveLabel ?? 'Live demo'}</h3>
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
              </>
            )}
          </div>
        </section>
      )}

      {!comingSoon && (
        <section id="limitations" className="tone tone-mist" aria-labelledby="lim-h">
          <div className="wrap reveal">
            <h2 id="lim-h">Known limitations</h2>
            {d.limitations.length === 0 ? (
              <p className="none-yet">None are documented yet.</p>
            ) : (
              <ul className="bullets">
                {d.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="tone tone-hero" aria-label="More projects and sources">
        <div className="wrap reveal">
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
