import { statusLabel } from '@/lib/content';
import type { ProjectStatus } from '@/lib/schemas';

export default function StatusPill({ status }: { status: ProjectStatus }) {
  return <span className={`pill pill-${status}`}>{statusLabel[status]}</span>;
}
