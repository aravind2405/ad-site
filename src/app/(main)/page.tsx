import Link from 'next/link';
import Button from '@/components/Button';
import JsonLd from '@/components/JsonLd';
import ProjectCard from '@/components/ProjectCard';
import { gridProjects, nextUpLine, profile } from '@/lib/content';
import { getRepoMeta } from '@/lib/github';
import { SITE_URL } from '@/lib/site';

const RESUME_FILE = 'Aravind-Danassegarane-Resume.pdf';

// Repository facts on the cards come live from GitHub and refresh hourly.
export const revalidate = 3600;

export default async function Home() {
  const metas = await Promise.all(gridProjects.map((p) => (p.repo ? getRepoMeta(p.repo) : null)));
  const { links } = profile;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          url: SITE_URL,
          sameAs: [links.linkedin, links.github].filter(Boolean),
        }}
      />
      <section className="hero-shell" aria-labelledby="hero-h">
        <div className="wrap hero">
          <h1 id="hero-h">{profile.headline}</h1>
          <p className="sub">{profile.subheadline}</p>
          <p className="creds">{profile.credentials}</p>
        </div>
      </section>

      <div className="wrap">
        <section id="projects" className="section" aria-labelledby="projects-h">
          <div className="section-head">
            <h2 id="projects-h" className="h2">
              Projects
            </h2>
            <p className="lede">Real systems, measured: transport, housing, energy and AI.</p>
          </div>
          <div className="project-grid">
            {gridProjects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} meta={metas[i]} />
            ))}
          </div>
          <p className="next-up">{nextUpLine()}</p>
        </section>

        <section className="section reveal" aria-labelledby="lab-h">
          <div className="band">
            <div>
              <span className="eyebrow">Experiments</span>
              <h2 id="lab-h">Curiosity Lab</h2>
              <p>Early experiments on rail delays, weather and my own room. None are finished.</p>
            </div>
            <Link className="btn btn-sm" href="/lab">
              Visit the lab
            </Link>
          </div>
        </section>

        <section id="contact" className="section reveal" aria-labelledby="contact-h">
          <div className="card contact">
            <div className="main">
              <h2 id="contact-h">{profile.contact.heading}</h2>
              <p>{profile.contact.body}</p>
            </div>
            <div className="side">
              {links.linkedin && (
                <Button href={links.linkedin} external>
                  LinkedIn
                </Button>
              )}
              {links.github && (
                <Button href={links.github} variant="ghost" external>
                  GitHub
                </Button>
              )}
              {links.resume && (
                <Button href={links.resume} variant="ghost" download={RESUME_FILE}>
                  Download resume
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
