export type ProjectStatus = 'building' | 'live' | 'soon';

export interface Project {
  slug: string;
  name: string;
  featured: boolean;
  status: ProjectStatus;
  question: string;
  summary: string;
  skills?: string[];
  tags?: string[];
  story: string | null;
  live?: string | null;
  code: string | null;
}

export interface ShelfItem {
  status: 'reading' | 'next' | 'done';
  kind: string;
  title: string;
  by: string;
  why?: string | null;
  stuck?: string | null;
  related: { name: string; href: string } | null;
}

export interface NowItem {
  label: string;
  tone: string;
  text: string;
}

export interface Experiment {
  id: string;
  name: string;
  question: string;
  aside: string;
  stage: number;
  uses: string;
  tags: string[];
}

export interface Profile {
  name: string;
  greeting: string;
  tagline: string;
  credentials: string;
  lookingFor: string;
  background: string;
  links: {
    email: string | null;
    resume: string | null;
    linkedin: string | null;
    github: string | null;
  };
}
