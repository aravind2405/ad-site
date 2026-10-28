import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDiagram } from './diagrams';
import { luminance, paletteFor, themeVariables } from './diagramTheme';
import { getProject } from './content';

describe('architecture diagrams', () => {
  it('loads RentLens as Mermaid text with the five stages in order', () => {
    const text = getDiagram('rentlens')!;
    expect(text.startsWith('flowchart LR')).toBe(true);
    const stages = [...text.matchAll(/subgraph \w+\["(\d) · ([^"]+)"\]/g)].map((m) => m[2]);
    expect(stages).toEqual(['Source', 'Ingestion', 'Transformation (dbt)', 'Storage', 'Output']);
  });

  it('returns null for a project with no diagram and for unsafe slugs', () => {
    expect(getDiagram('groundtruth')).toBeNull();
    expect(getDiagram('../package')).toBeNull();
    expect(getDiagram('rentlens/../../x')).toBeNull();
  });

  it('only keeps a definition for a real project, and every one is a flowchart', () => {
    const dir = join(process.cwd(), 'src', 'data', 'diagrams');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.mmd'))) {
      const slug = file.replace(/\.mmd$/, '');
      expect(getProject(slug), `${file} has no project`).toBeDefined();
      expect(getDiagram(slug)!.trimStart().startsWith('flowchart '), file).toBe(true);
    }
  });

  it('names the same steps as the project data, so the text version and the picture agree', () => {
    const text = getDiagram('rentlens')!.toLowerCase();
    for (const word of ['duckdb', 'parquet', 'stg_bond_lodgements', 'rents_by_month', 'chart.js']) {
      expect(text).toContain(word);
    }
  });
});

describe('diagram colours', () => {
  it('measures luminance from rgb strings', () => {
    expect(luminance('rgb(0, 0, 0)')).toBe(0);
    expect(luminance('rgb(255, 255, 255)')).toBeCloseTo(1, 5);
    expect(luminance('not a colour')).toBe(0);
  });

  it('picks the dark palette for light text and the light palette for dark text', () => {
    const onLightPage = paletteFor('rgb(22, 24, 29)');
    const onDarkPage = paletteFor('rgb(242, 243, 240)');
    expect(onLightPage.node).toBe('#ffffff');
    expect(onDarkPage.node).toBe('#1b1e25');
    expect(onLightPage.text).not.toBe(onDarkPage.text);
  });

  it('gives Mermaid readable text on its node colour in both palettes', () => {
    for (const text of ['rgb(22, 24, 29)', 'rgb(242, 243, 240)']) {
      const vars = themeVariables(paletteFor(text), 'sans-serif');
      const hex = (h: string) =>
        `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')})`;
      const [hi, lo] = [
        luminance(hex(vars.primaryTextColor)),
        luminance(hex(vars.primaryColor)),
      ].sort((a, b) => b - a);
      expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(7);
    }
  });
});
