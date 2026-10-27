import { notFound } from 'next/navigation';
import { getProject, projects } from '@/lib/content';
import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'Project · Aravind Danassegarane';
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return ogImage(project.question);
}
