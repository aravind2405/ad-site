import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import { getSkills, profile, projects } from '@/lib/content';
import { getRepoMeta } from '@/lib/github';

// Repository facts on the cards come live from GitHub and refresh hourly.
export const revalidate = 3600;

export default async function Home() {
  const metas = await Promise.all(projects.map((p) => (p.repo ? getRepoMeta(p.repo) : null)));
  const skills = getSkills();
  const { links } = profile;

  return (
    <>
      <section className="hero-shell" aria-labelledby="hero-h">
        <div className="wrap hero">
          <h1 id="hero-h">{profile.headline}</h1>
          <p className="sub">{profile.subheadline}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              See projects
            </a>
            {links.linkedin && (
              <a
                className="btn btn-ghost"
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
          </div>
          <p className="creds">{profile.credentials}</p>
        </div>
      </section>

      <div className="wrap">
        <section className="section" aria-labelledby="skills-h">
          <div className="section-head">
            <span className="eyebrow">Skills</span>
            <h2 id="skills-h" className="h2">
              What I work with
            </h2>
            <p className="lede">Every tool listed here is used in a project below.</p>
          </div>
          <ul className="skills">
            {skills.map((s) => (
              <li
                className="skill"
                key={s.name}
                title={`Used in ${s.projects.map((p) => p.name).join(', ')}`}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </section>

        <section id="projects" className="section" aria-labelledby="projects-h">
          <div className="section-head">
            <span className="eyebrow">Work</span>
            <h2 id="projects-h" className="h2">
              Projects
            </h2>
            <p className="lede">
              Real questions answered with real public data, built the way I would build at work.
              Each card links to the details, taken from the project&apos;s own README.
            </p>
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
              <h2 id="lab-h">Curiosity Lab</h2>
              <p>
                Side experiments with Sydney&apos;s trains, the weather and my own room. For the
                curious.
              </p>
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
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
