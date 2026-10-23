import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Document from '@/components/Document';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), icons: { icon: '/favicon.svg' } };

export const viewport: Viewport = { themeColor: '#14161B' };

export default function LabLayout({ children }: { children: ReactNode }) {
  return <Document dark>{children}</Document>;
}
