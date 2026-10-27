import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import { profile, projects } from '@/lib/content';
import { getRepoMeta } from '@/lib/github';

// Repository facts on the cards come live from GitHub and refresh hourly.
export const revalidate = 3600;

export default async function Home() {
  const metas = await Promise.all(projects.map((p) => (p.repo ? getRepoMeta(p.repo) : null)));
  const { links } = profile;

  return (
    <>
      <section className="hero-shell" aria-labelledby="hero-h">
        <div className="wrap hero">
          <h1 id="hero-h">{profile.headline}</h1>
          <p className="sub">{profile.subheadline}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              See my projects
            </a>
            {links.resume ? (
              <a
                className="btn btn-ghost"
                href={links.resume}
                download="Aravind-Danassegarane-Resume.pdf"
              >
                Download resume
              </a>
            ) : (
              links.linkedin && (
                <a
                  className="btn btn-ghost"
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )
            )}
          </div>
          <p className="creds">{profile.credentials}</p>
        </div>
      </section>

      <div className="wrap">
        <section id="projects" className="section" aria-labelledby="projects-h">
          <div className="section-head">
            <span className="eyebrow">Work</span>
            <h2 id="projects-h" className="h2">
              Projects
            </h2>
            <p className="lede">Real systems, measured: transport, housing, energy and AI.</p>
          </div>
          <div className="project-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} meta={metas[i]} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="lab-h">
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

        <section id="contact" className="section" aria-labelledby="contact-h">
          <div className="card contact">
            <div className="main">
              <h2 id="contact-h">{profile.contact.heading}</h2>
              <p>{profile.contact.body}</p>
            </div>
            <div className="side">
              {links.linkedin && (
                <a
                  className="btn btn-primary"
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {links.github && (
                <a
                  className="btn btn-ghost"
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {links.resume && (
                <a
                  className="btn btn-ghost"
                  href={links.resume}
                  download="Aravind-Danassegarane-Resume.pdf"
                >
                  Download resume
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
