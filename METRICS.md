# Metrics

Every number claimed about this site is recorded here with the date it was measured, the value, and the exact command that produced it. Raw outputs are in [`measurements/`](measurements/). The scripts are in [`scripts/measure/`](scripts/measure/).

## Measurement 2026-10-24

Measured 2026-10-24, 11:13 to 11:21 AEDT, against production.

| Item | Value |
|---|---|
| Site under test | https://www.aravindd.com, production deployment of `ad-site` commit `a746dde` |
| Dashboard under test | https://aravind2405.github.io/rentlens-nsw/, `rentlens-nsw` commit `ffdb9e0` (Pages build `built`) |
| Machine | macOS 27.0.1, Google Chrome 155.0.8059.85 (headless), Node v24.13.1 |
| Network | One home connection in Sydney, not controlled |
| Tools | Lighthouse 13.5.0, axe-core 4.14.0 driven by puppeteer-core 25.16.0, curl, openssl |

Setup (run once in an empty working directory, with the scripts copied in):

```bash
npm init -y && npm install --save-exact lighthouse@13.5.0 axe-core@4.14.0 puppeteer-core@25.16.0
cp <repo>/scripts/measure/* . && mkdir -p out
```

### 1. Lighthouse

Scores are the median of 3 runs. Mobile uses Lighthouse's default mobile preset and desktop uses `--preset=desktop`, both with simulated throttling. Performance range across the 3 runs is shown in brackets where it varied.

Commands:

```bash
bash run-lighthouse.sh                                                            # site: 11:13 to 11:17
BASE=https://aravind2405.github.io/rentlens-nsw PAGES="/" TAG=dashboard- bash run-lighthouse.sh   # dashboard: 11:19 to 11:20
python3 summarize-lighthouse.py                                                   # tables below
```

| Page | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 [88-100] | 100 | 100 | 100 | 0.77 s | 1.53 s | 8 ms | 0 | 224 KiB | 19 |
| `/lab` | mobile | 100 | 100 | 100 | 100 | 0.77 s | 1.86 s | 4 ms | 0 | 223 KiB | 19 |
| `/shelf` | mobile | 100 | 100 | 100 | 100 | 0.77 s | 1.87 s | 2 ms | 0 | 222 KiB | 19 |
| `/rentlens` | mobile | 99 [99-100] | 100 | 100 | 100 | 0.81 s | 1.95 s | 2 ms | 0 | 289 KiB | 21 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.43 s | 0 ms | 0 | 228 KiB | 21 |
| `/lab` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.43 s | 0 ms | 0 | 223 KiB | 19 |
| `/shelf` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.43 s | 0 ms | 0 | 222 KiB | 19 |
| `/rentlens` | desktop | 100 | 100 | 100 | 100 | 0.23 s | 0.44 s | 0 ms | 0 | 289 KiB | 21 |
| Dashboard | mobile | 98 | **87** | **96** | **90** | 1.90 s | 1.90 s | 0 ms | 0 | 71 KiB | 3 |
| Dashboard | desktop | 100 | **87** | **96** | **90** | 0.54 s | 0.54 s | 0 ms | 0 | 71 KiB | 3 |

JavaScript transferred per page (median): 140 to 141 KiB on `/`, `/lab` and `/shelf`, 200 KiB on `/rentlens` (includes the framed dashboard's Chart.js), 59 KiB on the dashboard itself. Full per-run data: [`measurements/2026-10-24/lighthouse-summary.json`](measurements/2026-10-24/lighthouse-summary.json).

One home-page mobile run scored 88 (Total Blocking Time scored 0.59 in that run); the other two scored 100. That is why the table reports medians and ranges.

### 2. Accessibility (axe-core)

axe-core 4.14.0 with rule tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`, at a 375 px phone viewport and a 1440 px desktop viewport. Started 11:17:44 (site) and 11:19:20 (dashboard).

Commands:

```bash
node run-axe.mjs                                                                  # site
BASE=https://aravind2405.github.io/rentlens-nsw PAGES="/" TAG=dashboard node run-axe.mjs   # dashboard
```

| Page | Violations (mobile / desktop) | Rules passed | Needs manual review |
|---|---|---|---|
| `/` | 0 / 0 | 36 | none |
| `/lab` | 0 / 0 | 39 | `color-contrast`, 2 elements |
| `/shelf` | 0 / 0 | 34 | none |
| `/rentlens` | 0 / 0 | 37 | `frame-tested`, 1 element (the embedded dashboard is not scanned from the parent page) |
| Dashboard | **3 / 3** | 21 | `color-contrast`, 9 elements |

Dashboard violations (identical at both viewports):

| Rule | Impact | Elements | Detail |
|---|---|---|---|
| `color-contrast` | serious | 12 | Small grey text `#9ca3af` on white measures 2.53:1 (4.5:1 needed) in the date, card sources, rank numbers and footer; green change figures `#16a34a` measure 3.29:1 |
| `landmark-one-main` | moderate | 1 | No `<main>` landmark |
| `region` | moderate | 12 | Content outside any landmark |

Raw results: [`axe-site.json`](measurements/2026-10-24/axe-site.json), [`axe-dashboard.json`](measurements/2026-10-24/axe-dashboard.json).

### 3. Security headers, TLS and exposure

Started 11:18:07. Command:

```bash
bash check-headers.sh > out/headers.txt
```

| Check | Result |
|---|---|
| Required headers present (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, HSTS) | 7 of 7 on `/`, `/lab`, `/shelf`, `/rentlens`, `/robots.txt`, `/sitemap.xml` and the 404 page |
| `X-Powered-By` header | absent |
| HSTS value on the custom domain | `max-age=63072000` (no `includeSubDomains`, no `preload`) |
| CSP | `default-src 'self'`; `script-src 'self' 'unsafe-inline'`; `style-src 'self' 'unsafe-inline'`; `frame-src` only the dashboard origin; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests` |
| TLS | 1.3 and 1.2 accepted; 1.0 and 1.1 rejected; certificate verifies; Let's Encrypt, expires 2027-01-21 |
| HTTP and alternate hosts | `http://www`, `http://` apex, `https://` apex and `aravind-ad.vercel.app` all end on `https://www.aravindd.com/` with status 200 (1 to 2 hops) |
| Sensitive paths (`/.env`, `/.git/config`, `/package.json`, `/vercel.json`, `/next.config.mjs`, `/tsconfig.json`, `/LICENSE`, `/src/app/page.tsx`) | all 404 |
| Source maps for the home page's JavaScript chunks | 403 |
| External hosts referenced by page HTML | `www.aravindd.com`, `github.com`, `aravind2405.github.io`, `www.linkedin.com`, `data.nsw.gov.au` |

Full output: [`headers.txt`](measurements/2026-10-24/headers.txt).

## Findings

Ordered by importance.

1. **The embedded dashboard was the weakest page (fixed, see the follow-up measurement below).** Accessibility 87, best practices 96, SEO 90. Causes: low-contrast small text (see the table above), no `<main>` landmark, no meta description, and a console error that is a 404 for `https://aravind2405.github.io/favicon.ico` (the dashboard has no favicon). Fixed in `rentlens-nsw` PR #17 (merge commit `027896f`). For reference, `#6b7280` on white measures 4.83:1 and `#15803d` on white measures 5.02:1, both above the 4.5:1 minimum.
2. **`/lab` needs a manual contrast check.** axe could not decide 2 elements on the dark theme.
3. **HSTS on the custom domain is the short form.** Adding `includeSubDomains` is low-risk; `preload` is a long-term commitment and should be a deliberate choice.
4. **The CSP allows inline scripts and styles.** This is needed by Next.js hydration today; a nonce-based policy would make pages render per request.
5. **Home page mobile performance varies run to run** (88 to 100 in 3 runs). Median is 100.

## Follow-up measurement 2026-10-24: dashboard after rentlens-nsw PR #17

Measured 2026-10-24, 11:39 to 11:41 AEDT, against the live dashboard at `rentlens-nsw` commit `027896f` (GitHub Pages build `built`; the plain URL was confirmed to serve the new `<main>` before measuring). Same machine, Chrome and tool versions as above, same scripts and settings. The fixes were: darker text colours for contrast, a `<main>` landmark, a meta description and a favicon.

Commands:

```bash
BASE=https://aravind2405.github.io/rentlens-nsw PAGES="/" TAG=dashboard-after node run-axe.mjs              # 11:39:43
BASE=https://aravind2405.github.io/rentlens-nsw PAGES="/" TAG=dashboard-after- bash run-lighthouse.sh      # 11:39:45 to 11:40:46
python3 summarize-lighthouse.py
```

Lighthouse, median of 3 runs (the "Before" rows repeat the baseline above, measured 11:19 to 11:20 at `rentlens-nsw` commit `ffdb9e0`):

| Dashboard | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Before | mobile | 98 | 87 | 96 | 90 | 1.90 s | 1.90 s | 0 ms | 0 | 71 KiB | 3 |
| **After** | mobile | 98 | **100** | **100** | **100** | 1.88 s | 1.88 s | 0 ms | 0 | 67 KiB | 3 |
| Before | desktop | 100 | 87 | 96 | 90 | 0.54 s | 0.54 s | 0 ms | 0 | 71 KiB | 3 |
| **After** | desktop | 100 [99-100] | **100** | **100** | **100** | 0.52 s | 0.52 s | 0 ms | 0 | 67 KiB | 3 |

axe-core 4.14.0, same rule tags and viewports as above:

| Dashboard | Violations (mobile / desktop) | Rules passed | Needs manual review |
|---|---|---|---|
| Before | 3 / 3 (`color-contrast` 12 elements, `landmark-one-main` 1, `region` 12) | 21 | `color-contrast`, 9 elements |
| **After** | **0 / 0** | 24 | none |

The Lighthouse console-error audit that flagged the missing favicon no longer fails. Performance did not change. The small difference in transfer size between the two measurements (71 KiB vs 67 KiB) was not investigated. A local measurement made before the merge gave the same scores and is recorded in `rentlens-nsw` `docs/log.md`.

Raw results: [`lighthouse-summary.json`](measurements/2026-10-24/lighthouse-summary.json) (now also includes the local before and after groups and these live runs) and [`axe-dashboard-after.json`](measurements/2026-10-24/axe-dashboard-after.json).

Still open from the findings above: the `/lab` contrast check (2 elements needing manual review), the short HSTS value on the custom domain, and the CSP's `'unsafe-inline'`.

## Not measured

- Real-user (field) data such as Core Web Vitals from visitors. Lighthouse is lab data from one machine and location, so these scores are not a guarantee for visitors on slow devices or networks.
- Keyboard-only navigation and screen-reader testing. Automated tools find only some accessibility problems.
- The skip-link pattern, focus order and reduced-motion behaviour.
- Anything about the other projects in this workspace.

## Reproduce

```bash
mkdir -p /tmp/measure && cd /tmp/measure
npm init -y && npm install --save-exact lighthouse@13.5.0 axe-core@4.14.0 puppeteer-core@25.16.0
cp /path/to/ad-site/scripts/measure/* . && mkdir -p out
bash run-lighthouse.sh && node run-axe.mjs && bash check-headers.sh > out/headers.txt && python3 summarize-lighthouse.py
```

Set `CHROME_PATH` for `run-lighthouse.sh` and edit the `executablePath` in `run-axe.mjs` if Chrome is not at the macOS default location. Results will differ slightly from the table: Lighthouse varies between runs and the site may have changed.
