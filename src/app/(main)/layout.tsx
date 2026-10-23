import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Document from '@/components/Document';
import SiteShell from '@/components/SiteShell';
import profileData from '@/data/profile.json';
import { SITE_URL } from '@/lib/site';
import type { Profile } from '@/lib/types';

const profile: Profile = profileData;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Aravind Danassegarane',
  description: profile.tagline,
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
  openGraph: { title: 'Aravind Danassegarane', description: profile.tagline, url: '/', siteName: 'Aravind Danassegarane', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#F4F5F2' };

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Document>
      <SiteShell>{children}</SiteShell>
    </Document>
  );
}
