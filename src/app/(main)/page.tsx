import Link from 'next/link';
import AskRotator from '@/components/AskRotator';
import Button from '@/components/Button';
import ContactForm from '@/components/ContactForm';
import HeroSignal from '@/components/HeroSignal';
import HomeStage from '@/components/HomeStage';
import JsonLd from '@/components/JsonLd';
import ProjectCard from '@/components/ProjectCard';
import ProjectCarousel from '@/components/ProjectCarousel';
import { gridProjects, lab, labStages, nextUpLine, profile } from '@/lib/content';
import { getRepoMeta } from '@/lib/github';
import { SITE_URL } from '@/lib/site';

const RESUME_FILE = 'Aravind-Danassegarane-Resume.pdf';

// Repository facts on the cards come live from GitHub and refresh hourly.
export const revalidate = 3600;

export default async function Home() {
  const metas = await Promise.all(gridProjects.map((p) => (p.repo ? getRepoMeta(p.repo) : null)));
  const { links } = profile;

  return (
    <div className="home">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          url: SITE_URL,
          sameAs: [links.linkedin, links.github].filter(Boolean),
        }}
      />
      <HomeStage />
      <section id="hero" className="hero-shell" aria-labelledby="hero-h">
        <div className="wrap hero">
          <h1 id="hero-h">{profile.headline}</h1>
          <p className="sub">{profile.subheadline}</p>
          <AskRotator questions={gridProjects.map((p) => p.question)} />
          <p className="creds">{profile.credentials}</p>
        </div>
        <a className="scroll-cue" href="#projects">
          Projects <span aria-hidden="true">↓</span>
        </a>
        <HeroSignal />
      </section>

      <section id="projects" className="projects-band" aria-labelledby="projects-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="projects-h" className="h2">
              Projects
            </h2>
            <p className="lede">Real systems, measured: transport, housing, energy and AI.</p>
          </div>
          <ProjectCarousel count={gridProjects.length}>
            {gridProjects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} meta={metas[i]} />
            ))}
          </ProjectCarousel>
          <p className="next-up">{nextUpLine()}</p>
          <a className="lab-peek" href="#lab">
            <span className="lab-peek-label">Curiosity Lab</span>
            <span className="lab-peek-names">{lab.experiments.map((e) => e.name).join(' · ')}</span>
            <span className="lab-peek-go">
              Take a look <span aria-hidden="true">↓</span>
            </span>
          </a>
        </div>
      </section>

      <section id="lab" className="lab-band" aria-labelledby="lab-h">
        <div className="wrap reveal">
          <div className="lab-band-head">
            <div>
              <h2 id="lab-h">Curiosity Lab</h2>
              <p>Early experiments on rail delays, weather and my own room. None are finished.</p>
            </div>
            <Link className="btn btn-sm lab-enter" href="/lab">
              Enter the Lab <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="lab-tiles">
            {lab.experiments.map((e) => (
              <li className="lab-tile" key={e.name}>
                <div className="lab-tile-top">
                  <h3>
                    <Link className="stretched" href="/lab">
                      {e.name}
                    </Link>
                  </h3>
                  <span className="stage-badge">{labStages[e.stage - 1]}</span>
                </div>
                <p>{e.question}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="contact-band" aria-labelledby="contact-h">
        <div className="wrap reveal">
          <div className="card contact">
            <div className="main">
              <h2 id="contact-h">{profile.contact.heading}</h2>
              <p>{profile.contact.body}</p>
              <div className="contact-links">
                {links.linkedin && (
                  <Button href={links.linkedin} variant="ghost" external>
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
            <div className="side">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
