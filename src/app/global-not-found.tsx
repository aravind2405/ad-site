import type { Metadata } from 'next';
import Button from '@/components/Button';
import Document from '@/components/Document';
import SiteShell from '@/components/SiteShell';

export const metadata: Metadata = { title: 'Page not found' };

// Shown for any address that matches no page. The site has two root layouts, so this
// file renders its own document.
export default function GlobalNotFound() {
  return (
    <Document>
      <SiteShell>
        <div className="wrap not-found">
          <p className="eyebrow">404</p>
          <h1>This page does not exist</h1>
          <p className="lede">The address may be mistyped, or the page may have moved.</p>
          <div className="hero-actions">
            <Button href="/">Go to the home page</Button>
            <Button href="/#projects" variant="ghost">
              See my projects
            </Button>
          </div>
        </div>
      </SiteShell>
    </Document>
  );
}
