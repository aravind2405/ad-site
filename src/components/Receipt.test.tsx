import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Receipt from './Receipt';

describe('Receipt', () => {
  it('renders nothing without receipt data', () => {
    expect(renderToStaticMarkup(<Receipt receipt={undefined} />)).toBe('');
  });

  it('shows the label, value, source, check date and a link', () => {
    const html = renderToStaticMarkup(
      <Receipt
        receipt={{
          label: 'Example',
          value: 'value',
          source: 'a public dataset',
          checked: '2026-10-24',
          href: 'https://example.com/how',
        }}
      />,
    );
    expect(html).toContain('RECEIPT');
    expect(html).toContain('Example');
    expect(html).toContain('value');
    expect(html).toContain('Source: a public dataset');
    expect(html).toContain('24 Oct 2026');
    expect(html).toContain('href="https://example.com/how"');
  });
});
