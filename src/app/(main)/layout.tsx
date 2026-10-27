import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Document from '@/components/Document';
import SiteShell from '@/components/SiteShell';
import { profile } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

const title = 'Aravind Danassegarane';
const description = profile.subheadline;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: `%s · ${title}` },
  description,
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
  openGraph: { title, description, url: '/', siteName: title, type: 'website' },
};

export const viewport: Viewport = { themeColor: '#F4F5F2' };

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Document>
      <SiteShell>{children}</SiteShell>
    </Document>
  );
}
