import type { ProjectStatus } from '@/lib/types';

const labels: Record<ProjectStatus, string> = {
  building: 'Building',
  live: 'Live',
  soon: 'Coming soon',
};

export default function StatusPill({ status }: { status: ProjectStatus }) {
  return <span className={`pill pill-${status}`}>{labels[status]}</span>;
}
