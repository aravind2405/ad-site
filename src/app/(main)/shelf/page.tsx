import type { Metadata } from 'next';
import ShelfBrowser from '@/components/ShelfBrowser';
import { shelf } from '@/lib/content';

const description = "What I'm reading and studying, and what stuck.";

export const metadata: Metadata = {
  title: 'The shelf',
  description,
  alternates: { canonical: '/shelf' },
  openGraph: {
    title: 'The shelf · Aravind Danassegarane',
    description,
    url: '/shelf',
    type: 'website',
  },
};

export default function Shelf() {
  return (
    <div className="wrap">
      <section className="page-head">
        <h1>The shelf</h1>
        <p>
          Courses and papers shaping how I work, with what I took from each and where it shows up in
          my projects.
        </p>
      </section>
      <ShelfBrowser items={shelf} />
    </div>
  );
}
