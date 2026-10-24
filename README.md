# ad-site

The source of [aravindd.com](https://www.aravindd.com), the portfolio of Aravind Danassegarane, a data engineer.

It is a Next.js 16 (App Router, TypeScript) site, hosted on Vercel. Project pages are written from each
project's own README and read live repository activity from GitHub.

## What is in it

| Route                         | Purpose                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Landing page: headline, projects, Curiosity Lab link, contact                                                               |
| `/projects/[slug]`            | One page per project: status, architecture, how it is checked, data licence, roadmap, limitations, live repository activity |
| `/shelf`                      | Courses and papers, filterable by status and type                                                                           |
| `/lab`                        | Curiosity Lab, a dark page of early-stage experiments                                                                       |
| `/robots.txt`, `/sitemap.xml` | Generated from the same project data                                                                                        |

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Node 24 (see `.nvmrc`).

## Quality gates

| Command                        | What it checks                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`            | TypeScript, strict mode                                                                                                                                         |
| `npm run lint`                 | ESLint with the Next.js core-web-vitals and TypeScript rules                                                                                                    |
| `npm run format:check`         | Prettier                                                                                                                                                        |
| `npm test`                     | Unit tests: content rules, the GitHub reader's failure handling, SEO files, security headers and redirects                                                      |
| `npm run build && npm run e2e` | Playwright against the production build: every page, security headers, the sticky menu, links, filters, and axe accessibility scans at phone and desktop widths |
| `npm run check`                | typecheck, lint, format check and unit tests in one go                                                                                                          |

GitHub Actions runs all of these, plus `npm audit` on production dependencies, on every push and pull request
(`.github/workflows/ci.yml`). Dependabot proposes weekly updates for npm packages and Actions.

## Content

Content is JSON in `src/data/`: `profile.json`, `shelf.json`, `lab.json`, and one file per project in
`src/data/projects/`. Everything is validated with Zod (`src/lib/schemas.ts`) when it is imported, so a
mistake fails the build and the tests instead of reaching visitors.

Rules the schema enforces:

- A planned project cannot link a repository or a demo, and lists its stack as `plannedStack`.
- A live project needs a live URL, and a started project needs a repository.
- Every project records the date it was checked against its README (`verified`).

To add a project, copy an existing file in `src/data/projects/`, add it to the list in `src/lib/content.ts`,
and run `npm run check`.

## Live GitHub data

Project pages and cards read the repository's last push date, licence and latest CI result from the GitHub
API, refreshed hourly. Any failure (rate limit, network, unexpected response) returns `null` and the page
renders without that block. Set an optional read-only `GITHUB_TOKEN` to raise the unauthenticated limit of
60 requests per hour.

## Security

`next.config.mjs` sets a Content-Security-Policy and five other security headers on every response and
redirects the old `aravind-ad.vercel.app` host to the canonical domain. The embedded RentLens dashboard runs
in a sandboxed iframe. The headers and redirects are covered by `src/config.test.ts`. No email address is
published; contact is through LinkedIn and GitHub.

The policy allows inline scripts because Next.js needs them for hydration. A nonce-based policy would make
pages render per request.

## Measurements

`METRICS.md` records Lighthouse, axe and security-header results with the date, value and exact command
for each. The scripts are in `scripts/measure/` and the raw results in `measurements/`.

## Deploying

Vercel builds every push to `main` (`vercel.json` sets the framework). Pull requests get preview
deployments. To deploy by hand, run this from this folder only:

```bash
vercel deploy --prod --scope aravind-db77
```

## Licence

Code under the [MIT licence](LICENSE). Project write-ups and other content are © Aravind Danassegarane.
The RentLens data credit is on the project page: data © State of New South Wales, Creative Commons
Attribution (CC BY).
