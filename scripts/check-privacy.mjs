// Fails if an email address appears anywhere in the built site (HTML, RSC payloads, JavaScript).
// The address is never written in this repository: the check looks for the shape of any email.
// Usage: node scripts/check-privacy.mjs [dir ...]   (default: the Next.js build output)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const dirs = process.argv.slice(2);
if (dirs.length === 0) dirs.push('.next/server/app', '.next/static');

const textFile = /\.(html|htm|js|mjs|css|json|txt|rsc|xml|map)$/;
const found = [];
let scanned = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path);
    else if (textFile.test(name) || name.endsWith('.body')) {
      scanned += 1;
      for (const hit of readFileSync(path, 'utf8').match(EMAIL) ?? []) found.push(`${path}: ${hit}`);
    }
  }
}

for (const dir of dirs) {
  try {
    walk(dir);
  } catch (error) {
    console.error(`Cannot read ${dir}: ${error.message}. Run "npm run build" first.`);
    process.exit(2);
  }
}

if (found.length > 0) {
  console.error(`Email-shaped text found in the build output:\n${found.join('\n')}`);
  process.exit(1);
}
console.log(`Privacy check passed: ${scanned} built files scanned, no email addresses.`);
