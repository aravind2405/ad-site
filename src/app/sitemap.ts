import type { MetadataRoute } from 'next';
import { projects } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ['', '/lab', '/shelf', ...projects.map((p) => `/projects/${p.slug}`)];
  return paths.map((path) => ({ url: `${SITE_URL}${path}`, lastModified }));
}
