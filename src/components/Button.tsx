import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  variant?: 'primary' | 'ghost';
  size?: 'default' | 'small';
  /** Opens in a new tab with a hidden note for screen readers. */
  external?: boolean;
  /** Download file name, for same-origin files such as the resume. */
  download?: string;
  /** The one allowed icon: a 16px stroke arrow after the label. */
  arrow?: boolean;
  children: ReactNode;
}

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// One button for the whole site: primary (filled) or ghost (bordered), 48px tall
// (44px when small). Labels start with a verb or name the destination.
export default function Button({
  href,
  variant = 'primary',
  size = 'default',
  external = false,
  download,
  arrow = false,
  children,
}: Props) {
  const className = `btn btn-${variant}${size === 'small' ? ' btn-sm' : ''}`;
  const content = (
    <>
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
      {arrow && <Arrow />}
    </>
  );
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  if (download) {
    return (
      <a className={className} href={href} download={download}>
        {content}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
