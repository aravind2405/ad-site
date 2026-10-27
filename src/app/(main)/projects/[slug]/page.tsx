import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/components/Button';
import Receipt from '@/components/Receipt';
import StatusPill from '@/components/StatusPill';
import { getProject, projects } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { getRepoMeta } from '@/lib/github';
import { readingMinutes } from '@/lib/readingTime';

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

  // Every section on the page, in order. The "On this page" list is built from the ones present.
  const toc = [
    { id: 'thirty-h', label: 'In 30 seconds' },
    ...(isLive ? [{ id: 'live-h', label: project.liveLabel ?? 'Live demo' }] : []),
    ...(d.willCover.length > 0 ? [{ id: 'cover-h', label: 'What it will cover' }] : []),
    ...(d.architecture ? [{ id: 'arch-h', label: 'How it works' }] : []),
    ...(d.decisions.length > 0 ? [{ id: 'dec-h', label: 'Decisions and trade-offs' }] : []),
    ...(d.practices.length > 0 ? [{ id: 'prac-h', label: 'How I know it works' }] : []),
    ...(d.limitations.length > 0 ? [{ id: 'lim-h', label: 'Known limitations' }] : []),
    ...(d.roadmap.length > 0 ? [{ id: 'road-h', label: "What's next" }] : []),
    ...(d.data && !isLive ? [{ id: 'data-h', label: 'Data source and licence' }] : []),
    ...(meta ? [{ id: 'repo-h', label: 'Repository activity' }] : []),
  ];
  const structured =
    d.decisions.length > 0 && d.decisions.every((x) => x.chose && x.rejected && x.why);

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
        <p className="read-time">{readingMinutes(project)} min read</p>
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

      <div className="detail-layout">
        <nav className="toc" aria-label="On this page">
          <p className="toc-title">On this page</p>
          <ol>
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="detail-main">
          <section className="detail-section" aria-labelledby="thirty-h">
            <h2 id="thirty-h">In 30 seconds</h2>
            <dl className="thirty">
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
          </section>

          {isLive && project.live && (
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

          {d.willCover.length > 0 && (
            <section className="detail-section" aria-labelledby="cover-h">
              <h2 id="cover-h">What it will cover</h2>
              <ul className="bullets">
                {d.willCover.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="soon">Case study coming soon.</p>
            </section>
          )}

          {d.architecture && (
            <section className="detail-section" aria-labelledby="arch-h">
              <h2 id="arch-h">{heading.how ?? 'How it works'}</h2>
              <p className="prose-p">{d.architecture.summary}</p>
              <ol className="flow" aria-label="Data flow">
                {d.architecture.steps.map((step) => (
                  <li key={step}>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {d.decisions.length > 0 && (
            <section className="detail-section" aria-labelledby="dec-h">
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
                <div style={{ display: 'grid', gap: 12 }}>
                  {d.decisions.map((dec) => (
                    <div className="decision" key={dec.title}>
                      <h3>{dec.title}</h3>
                      <p>{dec.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {d.practices.length > 0 && (
            <section className="detail-section" aria-labelledby="prac-h">
              <h2 id="prac-h">{heading.verify ?? 'How I know it works'}</h2>
              <ul className="bullets">
                {d.practices.map((item) => (
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

          {d.roadmap.length > 0 && (
            <section className="detail-section" aria-labelledby="road-h">
              <h2 id="road-h">{heading.next ?? "What's next"}</h2>
              <ul className="bullets">
                {d.roadmap.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {d.data && !isLive && (
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

          <nav className="exits" aria-label="More projects">
            <Link href={`/projects/${previous.slug}`}>
              <span className="exit-label">Previous project</span>
              <span className="exit-title">{previous.name}</span>
            </Link>
            <Link href={`/projects/${next.slug}`}>
              <span className="exit-label">Next project</span>
              <span className="exit-title">{next.name}</span>
            </Link>
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                <span className="exit-label">Code</span>
                <span className="exit-title">
                  {project.repo}
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
              </a>
            )}
            <Link href="/lab">
              <span className="exit-label">More to explore</span>
              <span className="exit-title">Curiosity Lab</span>
            </Link>
          </nav>

          <p className="provenance">
            Content checked against {project.verified.against} on{' '}
            {formatDate(project.verified.date)}.
            {meta ? ' Repository activity is read live from GitHub and refreshed hourly.' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
