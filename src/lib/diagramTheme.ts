export interface DiagramPalette {
  text: string;
  node: string;
  nodeBorder: string;
  line: string;
  cluster: string;
  clusterBorder: string;
}

const light: DiagramPalette = {
  text: '#16181d',
  node: '#ffffff',
  nodeBorder: '#a9b0bc',
  line: '#4a5260',
  cluster: '#f4f5f2',
  clusterBorder: '#dadfd6',
};

const dark: DiagramPalette = {
  text: '#f2f3f0',
  node: '#1b1e25',
  nodeBorder: '#5a606c',
  line: '#c4cad5',
  cluster: '#14161b',
  clusterBorder: '#2a2e36',
};

/** Relative luminance of an `rgb(...)` or `rgba(...)` colour string, 0 (black) to 1 (white). */
export function luminance(color: string): number {
  const m = color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  if (!m || m.length < 3) return 0;
  const [r, g, b] = m.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks the diagram palette that suits the text colour of the place it is drawn in. */
export function paletteFor(textColor: string): DiagramPalette {
  return luminance(textColor) > 0.4 ? dark : light;
}

/** Mermaid `themeVariables` for a palette. */
export function themeVariables(p: DiagramPalette, fontFamily: string) {
  return {
    fontFamily,
    fontSize: '15px',
    primaryColor: p.node,
    primaryTextColor: p.text,
    primaryBorderColor: p.nodeBorder,
    lineColor: p.line,
    textColor: p.text,
    mainBkg: p.node,
    nodeBorder: p.nodeBorder,
    clusterBkg: p.cluster,
    clusterBorder: p.clusterBorder,
    edgeLabelBackground: p.cluster,
    titleColor: p.text,
  };
}
