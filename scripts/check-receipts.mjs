// Every number shown in site copy needs a receipt in METRICS.md (or a reasoned entry in
// scripts/receipts-allowlist.json). Scans the string values of the content files in src/data.
// Version labels such as v0.1 and ISO dates are labels, not claims, and are skipped.
// Usage: node scripts/check-receipts.mjs
//   Overrides for tests: RECEIPTS_DATA_DIR, RECEIPTS_METRICS, RECEIPTS_ALLOWLIST
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = process.env.RECEIPTS_DATA_DIR ?? 'src/data';
const metricsPath = process.env.RECEIPTS_METRICS ?? 'METRICS.md';
const allowPath = process.env.RECEIPTS_ALLOWLIST ?? 'scripts/receipts-allowlist.json';

const NUMBER = /(?<![\w.-])\d+(?:[.,]\d+)*%?(?![\w-])/g;
const SKIP_KEYS = new Set(['date', 'href', 'repo', 'live', 'licenceLink', 'slug', 'id', 'url']);
const maskDatesAndVersions = (text) =>
  text
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\bv\d+(?:\.\d+)*\b/gi, ' ');

const allowed = new Set(Object.keys(JSON.parse(readFileSync(allowPath, 'utf8')).allowed));
const receipts = maskDatesAndVersions(readFileSync(metricsPath, 'utf8'));
const hasReceipt = (n) => new RegExp(`(?<![\\w.-])${n.replace(/[.,%]/g, (c) => `\\${c}`)}(?![\\w-])`).test(receipts);

const missing = [];
function visit(value, path, file) {
  if (typeof value === 'string') {
    if (/^https?:\/\//.test(value)) return;
    for (const match of maskDatesAndVersions(value).matchAll(NUMBER)) {
      const n = match[0].replace(/,$/, '');
      if (!allowed.has(n) && !hasReceipt(n)) missing.push(`${file} ${path}: "${n}" in "${value.slice(0, 80)}"`);
    }
  } else if (Array.isArray(value)) value.forEach((v, i) => visit(v, `${path}[${i}]`, file));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!SKIP_KEYS.has(k)) visit(v, `${path}.${k}`, file);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.json')) visit(JSON.parse(readFileSync(path, 'utf8')), '', path);
  }
}
walk(dataDir);

if (missing.length > 0) {
  console.error(`Numbers in site copy with no receipt in METRICS.md:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('Receipt check passed: every number in site copy has a receipt or an allowlist reason.');
