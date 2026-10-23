import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const routes = ['/', '/rentlens', '/lab', '/shelf'];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((path) => ({ url: `${SITE_URL}${path === '/' ? '' : path}`, lastModified }));
}
