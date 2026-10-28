import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The Mermaid text for a project's architecture diagram, or null if it has none.
 * Definitions live in src/data/diagrams/<slug>.mmd so they are versioned and reviewed like code.
 */
export function getDiagram(slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    return readFileSync(join(process.cwd(), 'src', 'data', 'diagrams', `${slug}.mmd`), 'utf8');
  } catch {
    return null;
  }
}
