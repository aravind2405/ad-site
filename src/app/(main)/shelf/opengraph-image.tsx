import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'The shelf · Aravind Danassegarane';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage('The shelf');
}
