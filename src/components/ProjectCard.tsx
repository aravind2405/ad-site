import Link from 'next/link';
import { ViewTransition } from 'react';
import StatusPill from '@/components/StatusPill';
import { formatDate } from '@/lib/format';
import type { RepoMeta } from '@/lib/github';
import type { Project } from '@/lib/schemas';

// A short row: the first few tools. The case study lists the rest.
const MAX_TAGS = 4;

interface Props {
  project: Project;
  meta: RepoMeta | null;
}

export default function ProjectCard({ project, meta }: Props) {
  const { slug, name, status, question, stack, repo, live, liveLabel } = project;
  return (
    <ViewTransition name={`project-${slug}`} share="morph" default="none">
      <article className="card project-card">
        <div className="card-row">
          <StatusPill status={status} />
          {meta && <span className="card-updated">Updated {formatDate(meta.pushedAt)}</span>}
        </div>
        <h3>
          <Link className="stretched" href={`/projects/${slug}`}>
            {name}
          </Link>
        </h3>
        <p className="problem">{question}</p>
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
        </ul>
        {(repo || live) && (
          <div className="card-links">
            {repo && (
              <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
                Repo<span className="sr-only"> for {name} on GitHub (opens in a new tab)</span>
              </a>
            )}
            {live && (
              <a href={live} target="_blank" rel="noopener noreferrer">
                {liveLabel ?? 'Live'}
                <span className="sr-only"> for {name} (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </article>
    </ViewTransition>
  );
}
