import { profile } from '@/lib/content';
import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'Aravind Danassegarane';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage(profile.subheadline);
}
