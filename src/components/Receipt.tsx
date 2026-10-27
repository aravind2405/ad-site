import { formatDate } from '@/lib/format';
import type { Project } from '@/lib/schemas';

// Shown only when a project supplies a receipt (a measured value with its source).
// No project has one yet, so nothing renders until real data is added.
export default function Receipt({ receipt }: { receipt: Project['receipt'] }) {
  if (!receipt) return null;
  return (
    <aside className="receipt" aria-label="Receipt">
      <span className="receipt-tag">RECEIPT</span>
      <p className="receipt-value">
        <span>{receipt.label}</span> <strong>{receipt.value}</strong>
      </p>
      <p className="receipt-source">
        Source: {receipt.source} · checked{' '}
        <time dateTime={receipt.checked}>{formatDate(receipt.checked)}</time>
      </p>
      <a href={receipt.href} target="_blank" rel="noopener noreferrer">
        How I got this<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </aside>
  );
}
