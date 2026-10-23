import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Document from '@/components/Document';
import SiteShell from '@/components/SiteShell';
import profileData from '@/data/profile.json';
import type { Profile } from '@/lib/types';

const profile: Profile = profileData;

export const metadata: Metadata = {
  title: 'Aravind Danassegarane',
  description: profile.tagline,
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'Aravind Danassegarane', description: profile.tagline },
};

export const viewport: Viewport = { themeColor: '#F4F5F2' };

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Document>
      <SiteShell>{children}</SiteShell>
    </Document>
  );
}
