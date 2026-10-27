import Link from 'next/link';
import { ViewTransition } from 'react';
import StatusPill from '@/components/StatusPill';
import { formatDate } from '@/lib/format';
import type { RepoMeta } from '@/lib/github';
import type { Project } from '@/lib/schemas';

// The card shows the first few technologies; the details page lists them all.
const MAX_TAGS = 4;

interface Props {
  project: Project;
  meta: RepoMeta | null;
}

export default function ProjectCard({ project, meta }: Props) {
  const { slug, name, status, question, summary, stack, plannedStack, repo, live, liveLabel } =
    project;
  return (
    <ViewTransition name={`project-${slug}`} share="morph" default="none">
      <article className="card project-card">
        <div className="card-row">
          <span className="name">{name}</span>
          <StatusPill status={status} />
        </div>
        <h3>{question}</h3>
        <p>{summary}</p>
        <ul
          className="tags"
          aria-label={`Technology for ${name}`}
          style={{ margin: 0, padding: 0, listStyle: 'none' }}
        >
          {stack.slice(0, MAX_TAGS).map((t) => (
            <li className="tag" key={t}>
              {t}
            </li>
          ))}
          {plannedStack.slice(0, MAX_TAGS).map((t) => (
            <li className="tag tag-planned" key={t} title="Planned, not built yet">
              {t} (planned)
            </li>
          ))}
        </ul>
        <div className="spacer" />
        <div className="card-foot">
          <div className="card-links">
            <Link className="stretched" href={`/projects/${slug}`}>
              View details<span className="sr-only"> of {name}</span>
            </Link>
            {repo && (
              <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
                Code<span className="sr-only"> for {name} on GitHub (opens in a new tab)</span>
              </a>
            )}
            {live && (
              <a href={live} target="_blank" rel="noopener noreferrer">
                {liveLabel ?? 'Live demo'}
                <span className="sr-only"> for {name} (opens in a new tab)</span>
              </a>
            )}
          </div>
          {meta && <span className="card-updated">Updated {formatDate(meta.pushedAt)}</span>}
        </div>
      </article>
    </ViewTransition>
  );
}
