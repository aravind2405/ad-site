import Link from 'next/link';
import StatusPill from '@/components/StatusPill';
import profileData from '@/data/profile.json';
import projectsData from '@/data/projects.json';
import nowData from '@/data/now.json';
import shelfData from '@/data/shelf.json';
import type { NowItem, Profile, Project, ShelfItem } from '@/lib/types';

const profile: Profile = profileData;
const projects: Project[] = projectsData as Project[];
const now: NowItem[] = nowData;
const shelf: ShelfItem[] = shelfData as ShelfItem[];

function ProjectLinks({ p }: { p: Project }) {
  if (!p.story && !p.live && !p.code) return null;
  return (
    <div className="links">
      {p.story && <Link href={p.story}>Read the story</Link>}
      {p.live && <a href={p.live}>Live dashboard</a>}
      {p.code && <a href={p.code}>Code</a>}
    </div>
  );
}

export default function Home() {
  const featured = projects.find((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const reading = shelf.find((s) => s.status === 'reading' && s.kind !== 'Course');
  const { links } = profile;
  const contactButtons = [
    { label: 'Download resume', href: links.resume },
    { label: 'LinkedIn', href: links.linkedin },
    { label: 'GitHub', href: links.github },
  ].filter((b): b is { label: string; href: string } => Boolean(b.href));

  return (
    <div className="wrap">
      <section className="hero">
        <h1>{profile.greeting}</h1>
        <p className="tagline">{profile.tagline}</p>
        <div className="actions">
          <a className="btn btn-primary" href="#projects">See my projects</a>
          {links.resume && <a className="btn btn-ghost" href={links.resume}>Download resume</a>}
        </div>
        <p className="creds">{profile.credentials}</p>
      </section>

      <section id="projects" className="section" aria-labelledby="pf-h">
        <h2 id="pf-h" className="h2">Projects</h2>
        <p className="lede">Real questions about Australia, answered with real public data and built the way I&apos;d build at work.</p>

        {featured && (
          <article className="card featured">
            <div className="main">
              <div className="card-row" style={{ justifyContent: 'flex-start' }}>
                <span className="mono muted" style={{ fontSize: 13 }}>Flagship · {featured.name}</span>
                <StatusPill status={featured.status} />
              </div>
              <h3>{featured.question}</h3>
              <p>{featured.summary}</p>
              <ProjectLinks p={featured} />
            </div>
            <div className="side">
              <span className="mono muted" style={{ fontSize: 13 }}>Skills it shows</span>
              <ul>{featured.skills?.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </article>
        )}

        <div className="grid">
          {others.map((p) => (
            <article className="card stack" key={p.slug}>
              <div className="card-row">
                <span className="mono muted" style={{ fontSize: 13 }}>{p.name}</span>
                <StatusPill status={p.status} />
              </div>
              <h3>{p.question}</h3>
              <p>{p.summary}</p>
              <div className="tags">{p.tags?.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
              <ProjectLinks p={p} />
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-h">
        <h2 id="how-h" className="h2-sm">How I work</h2>
        <div className="principles">
          <div><strong>Every number has a receipt</strong><span>If I claim a result, there&apos;s a query or a log behind it you can check.</span></div>
          <div><strong>Tested before it ships</strong><span>Data checks and automated tests catch the wrong numbers before anyone sees them.</span></div>
          <div><strong>Built on messy, real data</strong><span>No tutorial datasets. Live feeds and government records, with all their quirks.</span></div>
        </div>
      </section>

      <section className="section" aria-labelledby="now-h">
        <h2 id="now-h" className="h2-sm">Right now</h2>
        <div className="now">
          {now.map((n) => (
            <div key={n.label}><span className={`label tone-${n.tone}`}>{n.label}</span><span>{n.text}</span></div>
          ))}
          {reading && (
            <Link href="/shelf"><span className="label tone-purple">Reading</span><span>{reading.title}</span></Link>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="lab-h">
        <div className="band">
          <div>
            <h2 id="lab-h">Curiosity Lab</h2>
            <p>Side experiments with Sydney&apos;s trains, the weather and my own room. For the curious.</p>
          </div>
          <Link className="btn btn-sm" href="/lab">Visit the lab</Link>
        </div>
      </section>

      <section id="contact" className="section" aria-labelledby="contact-h">
        <div className="card contact">
          <div className="main">
            <h2 id="contact-h">Know a team that needs a data engineer?</h2>
            <p>{profile.lookingFor}</p>
            <p className="muted" style={{ fontSize: 15 }}>{profile.background}</p>
          </div>
          <div className="side">
            {links.email && <a className="btn btn-primary" href={`mailto:${links.email}`}>Email me</a>}
            {contactButtons.map((b) => (
              <a className="btn btn-ghost btn-sm" href={b.href} key={b.label} {...(b.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{b.label}</a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
