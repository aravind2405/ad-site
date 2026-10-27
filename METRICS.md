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

The contrast check also needs `pngjs`: `npm install --save-exact pngjs@7.0.0`.

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
2. **`/lab` needed a manual contrast check (resolved).** axe could not decide 2 elements on the dark theme; the contrast check in the redesign measurement below measures them at 5.39:1 at the lowest.
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

## Redesign measurement 2026-10-24 (commit `9f6d5bb`, measured locally before deploy)

Measured 2026-10-24 from 13:02 to 13:09 AEDT against a local production build (`npm run build`, then `next start` on port 3700) of `ad-site` commit `9f6d5bb`. This is **not** the live site: it has not been deployed yet, and local runs have no CDN, so they are only comparable with other local runs. The previous version (`fb6d5ba`, then `main`) was measured the same way at 12:43 for comparison. Same machine, Chrome and tool versions as above.

Commands (in the working directory with the scripts copied in, `pngjs@7.0.0` also installed for the contrast check):

```bash
export P="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /projects/groundtruth /shelf /lab"
BASE=http://127.0.0.1:3700 PAGES="$P" TAG=redesign node run-axe.mjs                                # 13:02:05
BASE=http://127.0.0.1:3700 PAGES="$P" TAG=redesign node check-contrast.mjs                         # 13:02:21
BASE=http://127.0.0.1:3700 PAGES="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /shelf /lab" \
  TAG=redesign- bash run-lighthouse.sh                                                             # 13:02:37 to 13:09:12
BASE=http://127.0.0.1:3800 PAGES="/" TAG=mainlocal- bash run-lighthouse.sh                         # previous version, 12:43
python3 summarize-lighthouse.py
```

### Lighthouse (local, median of 3 runs, 36 of 36 runs succeeded)

| Page | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.30 s | 0 ms | 0 | 224 KiB | 19 |
| `/projects/rentlens` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.30 s | 0 ms | 0 | 290 KiB | 21 |
| `/projects/ontimesydney` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.30 s | 0 ms | 0 | 224 KiB | 19 |
| `/projects/gridwatch` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.31 s | 8 ms | 0 | 222 KiB | 19 |
| `/shelf` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.31 s | 7 ms | 0 | 222 KiB | 19 |
| `/lab` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.31 s | 7 ms | 0 | 223 KiB | 19 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 224 KiB | 19 |
| `/projects/rentlens` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 290 KiB | 21 |
| `/projects/ontimesydney` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 224 KiB | 19 |
| `/projects/gridwatch` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 222 KiB | 19 |
| `/shelf` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 222 KiB | 19 |
| `/lab` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 223 KiB | 19 |

`/projects/groundtruth` was not run through Lighthouse; it has the same template as `/projects/gridwatch`.

Like for like against the previous version, home page, local:

| Version | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|
| Previous (`fb6d5ba`) | mobile | 98 | 100 | 100 | 100 | 0.76 s | 2.32 s | 8 ms | 231 KiB | 19 |
| Redesign (`9f6d5bb`) | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.30 s | 0 ms | 224 KiB | 19 |
| Previous (`fb6d5ba`) | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 236 KiB | 21 |
| Redesign (`9f6d5bb`) | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 224 KiB | 19 |

The redesign did not change the scores, and no Lighthouse audit below 100 remains outside performance. A mobile LCP of about 2.3 s is the same for both versions in this local setup; the live CDN numbers earlier in this file (1.5 to 2.0 s) come from a different environment and should not be compared with these.

### Accessibility (axe-core)

axe-core 4.14.0, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`, phone and desktop viewports, commit `9f6d5bb`.

| Page | Violations (mobile / desktop) | Rules passed | Needs manual review |
|---|---|---|---|
| `/` | 0 / 0 | 37 | `color-contrast`, 36 elements |
| `/projects/rentlens` | 0 / 0 | 42 | `frame-tested`, 1 elements |
| `/projects/ontimesydney` | 0 / 0 | 39 | none |
| `/projects/gridwatch` | 0 / 0 | 37 | none |
| `/projects/groundtruth` | 0 / 0 | 37 | none |
| `/shelf` | 0 / 0 | 36 | none |
| `/lab` | 0 / 0 | 40 | `color-contrast`, 2 elements |

All 14 page and viewport combinations have 0 violations. A first scan found one best-practice violation, `heading-order` on `/shelf` (cards used `h3` directly under the `h1`); it was fixed before this commit by making the card titles `h2`. The end-to-end tests now include the best-practice rules, so that class of problem fails CI.

### Contrast over gradients and other backgrounds

axe cannot decide contrast where text sits over a gradient, which is why the home page shows 36 elements "needs manual review" and `/lab` shows 2. `check-contrast.mjs` measures them: it renders the page with the text made transparent (and transitions disabled), samples the real pixels behind each rendered line of glyphs, and computes the lowest WCAG contrast ratio per text node against the 4.5:1 requirement (3:1 for large text).

| Page | Text nodes (per viewport) | Lowest, mobile | Lowest, desktop | Below threshold |
|---|---|---|---|---|
| `/` | 89 | 6.43:1 | 6.43:1 | 0 |
| `/projects/rentlens` | 75 | 6.43:1 | 6.31:1 | 0 |
| `/projects/ontimesydney` | 69 | 6.43:1 | 6.43:1 | 0 |
| `/projects/gridwatch` | 31 | 6.43:1 | 6.43:1 | 0 |
| `/projects/groundtruth` | 31 | 6.43:1 | 6.43:1 | 0 |
| `/shelf` | 47 | 6.43:1 | 6.43:1 | 0 |
| `/lab` | 50 | 5.39:1 | 5.39:1 | 0 |

No text on any page is below its threshold. The lowest ratio on the light pages is 6.31:1 and on the dark Lab page 5.39:1, so the gradients do not weaken contrast. The `frame-tested` item on `/projects/rentlens` is the embedded dashboard, which is a separate page measured above.

How the checker was validated, because a checker that cannot fail proves nothing:

- **Negative control:** run on the old dashboard (unchanged `docs/index.html` from `rentlens-nsw` before PR #17), it reports the known ratios, 2.54:1 for `#9CA3AF` text and 3.30:1 for `#16A34A` text, and flags 22 elements per viewport.
- **Independent calculation:** run on the live dashboard, its lowest ratio is 4.55:1, which matches the 4.55:1 computed by hand for the inactive filter buttons (`#6B7280` on `#F7F8FA`). That clears the 4.5:1 minimum by 0.05, so those buttons are close to the limit.
- **Two bugs found and fixed while building it:** sampling the element's whole box included its border and rounded corners, and `transition: all` on the dashboard buttons left the text mid-fade in the screenshot. Both produced false failures and are why the script samples glyph lines and disables transitions.

### Tests

| Command | Result (commit `9f6d5bb`) |
|---|---|
| `npm test` | 41 unit tests passed |
| `npm run build && npm run e2e` | 43 end-to-end and accessibility tests passed |
| `npm run check` | typecheck, lint, format check and unit tests passed |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |

### Notes on method

- `networkidle0` never settles for a second load of the home page in the same Chrome profile: the redesigned home page is refreshed hourly (`s-maxage=3600, stale-while-revalidate`), so Chrome revalidates the router's prefetch requests in the background. The server answers those requests in about a millisecond, a fresh browser context never hangs (0 of 12 runs), and Lighthouse and the Playwright tests are unaffected. `run-axe.mjs` and `check-contrast.mjs` now use one isolated browser context per page and wait for `load`, fonts and a short settle instead. This changes how the page is awaited, not what is measured; earlier results in this file were produced before that change and remain valid.
- Local numbers are not live numbers. The live site, its security headers and the redirects were re-measured after deployment; see the next section.

## Live measurement 2026-10-24 (production, `ad-site` commit `fff532c`)

Measured against https://www.aravindd.com after PR #1 was merged and deployed: `ad-site` commit `fff532c` (squash merge of the redesign) and, in the embedded dashboard, `rentlens-nsw` commit `027896f`. Same machine, Chrome and tool versions as above. Times are AEDT.

| Measurement | Started |
|---|---|
| axe-core | 13:30:29 |
| Contrast check | 13:30:47 |
| Security headers, TLS, redirects, exposed paths | 13:44:12 (finished 13:44:41) |
| Lighthouse, 36 runs paced 20 s apart | 13:46:46 (finished 14:07:39) |

Commands (scripts as committed, from the working directory with the tools installed):

```bash
export P="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /projects/groundtruth /shelf /lab"
BASE=https://www.aravindd.com PAGES="$P" TAG=live-redesign node run-axe.mjs
BASE=https://www.aravindd.com PAGES="$P" TAG=live-redesign node check-contrast.mjs
bash check-headers.sh > out/headers-live-redesign.txt
BASE=https://www.aravindd.com PAGES="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /shelf /lab" \
  TAG=live-redesign- PAUSE=20 bash run-lighthouse.sh
python3 summarize-lighthouse.py
```

### Lighthouse (live, median of 3 runs; 36 of 36 runs succeeded, every document returned 200)

| Page | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 [99-100] | 100 | 100 | 100 | 0.84 s | 1.87 s | 0 ms | 0 | 217 KiB | 19 |
| `/projects/rentlens` | mobile | 100 [99-100] | 100 | 100 | 100 | 0.79 s | 1.90 s | 5 ms | 0 | 283 KiB | 21 |
| `/projects/ontimesydney` | mobile | 100 [91-100] | 100 | 100 | 100 | 0.81 s | 0.94 s | 3 ms | 0 | 216 KiB | 19 |
| `/projects/gridwatch` | mobile | 100 [98-100] | 100 | 100 | 100 | 0.77 s | 1.81 s | 2 ms | 0 | 215 KiB | 19 |
| `/shelf` | mobile | 100 | 100 | 100 | 100 | 0.80 s | 1.87 s | 4 ms | 0 | 215 KiB | 19 |
| `/lab` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 1.87 s | 1 ms | 0 | 215 KiB | 19 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.23 s | 0.42 s | 0 ms | 0 | 217 KiB | 19 |
| `/projects/rentlens` | desktop | 100 [99-100] | 100 | 100 | 100 | 0.23 s | 0.43 s | 0 ms | 0 | 283 KiB | 21 |
| `/projects/ontimesydney` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0.42 s | 0 ms | 0 | 216 KiB | 19 |
| `/projects/gridwatch` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.43 s | 0 ms | 0 | 215 KiB | 19 |
| `/shelf` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.43 s | 0 ms | 0 | 215 KiB | 19 |
| `/lab` | desktop | 100 | 100 | 100 | 100 | 0.22 s | 0.39 s | 0 ms | 0 | 215 KiB | 19 |

No Lighthouse audit below 100 remains outside performance. `/projects/groundtruth` was not run; it uses the same template as `/projects/gridwatch`. The widest performance spread was on `/projects/ontimesydney` on mobile (91 to 100 across its three runs; the median is 100).

The old site against the new one, live, measured with the same scripts (old site: this morning, 11:13 to 11:17):

| Page | Form | Version | Perf | A11y | Best practices | SEO | LCP | TBT | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | Old site | 100 [88-100] | 100 | 100 | 100 | 1.53 s | 8 ms | 224 KiB | 19 |
| | | New site | 100 [99-100] | 100 | 100 | 100 | 1.87 s | 0 ms | 217 KiB | 19 |
| `/` | desktop | Old site | 100 | 100 | 100 | 100 | 0.43 s | 0 ms | 228 KiB | 21 |
| | | New site | 100 | 100 | 100 | 100 | 0.42 s | 0 ms | 217 KiB | 19 |
| `/lab` | mobile | Old site | 100 | 100 | 100 | 100 | 1.86 s | 4 ms | 223 KiB | 19 |
| | | New site | 100 | 100 | 100 | 100 | 1.87 s | 1 ms | 215 KiB | 19 |
| `/lab` | desktop | Old site | 100 | 100 | 100 | 100 | 0.43 s | 0 ms | 223 KiB | 19 |
| | | New site | 100 | 100 | 100 | 100 | 0.39 s | 0 ms | 215 KiB | 19 |
| `/shelf` | mobile | Old site | 100 | 100 | 100 | 100 | 1.87 s | 2 ms | 222 KiB | 19 |
| | | New site | 100 | 100 | 100 | 100 | 1.87 s | 4 ms | 215 KiB | 19 |
| `/shelf` | desktop | Old site | 100 | 100 | 100 | 100 | 0.43 s | 0 ms | 222 KiB | 19 |
| | | New site | 100 | 100 | 100 | 100 | 0.43 s | 0 ms | 215 KiB | 19 |
| `/rentlens`, now `/projects/rentlens` | mobile | Old site | 99 [99-100] | 100 | 100 | 100 | 1.95 s | 2 ms | 289 KiB | 21 |
| | | New site | 100 [99-100] | 100 | 100 | 100 | 1.90 s | 5 ms | 283 KiB | 21 |
| `/rentlens`, now `/projects/rentlens` | desktop | Old site | 100 | 100 | 100 | 100 | 0.44 s | 0 ms | 289 KiB | 21 |
| | | New site | 100 [99-100] | 100 | 100 | 100 | 0.43 s | 0 ms | 283 KiB | 21 |

Scores are unchanged. The home page's mobile LCP is 0.34 s higher than before (1.87 s against 1.53 s), which fits the larger headline now being the largest paint; all other pages are within 0.1 s of before.

### Accessibility (axe-core, live)

Same rule tags and viewports as above.

| Page | Violations (mobile / desktop) | Rules passed | Needs manual review |
|---|---|---|---|
| `/` | 0 / 0 | 37 | `color-contrast`, 36 elements |
| `/projects/rentlens` | 0 / 0 | 42 | `frame-tested`, 1 elements |
| `/projects/ontimesydney` | 0 / 0 | 39 | none |
| `/projects/gridwatch` | 0 / 0 | 37 | none |
| `/projects/groundtruth` | 0 / 0 | 37 | none |
| `/shelf` | 0 / 0 | 36 | none |
| `/lab` | 0 / 0 | 40 | `color-contrast`, 2 elements |

All 14 page and viewport combinations have 0 violations, and the pass counts and review items are identical to the local measurement of the same commit. The review items are settled by the contrast check below, apart from `frame-tested` on `/projects/rentlens`, which is the embedded dashboard measured separately.

### Contrast (live)

| Page | Text nodes (per viewport) | Lowest, mobile | Lowest, desktop | Below threshold |
|---|---|---|---|---|
| `/` | 89 | 6.43:1 | 6.43:1 | 0 |
| `/projects/rentlens` | 75 | 6.43:1 | 6.31:1 | 0 |
| `/projects/ontimesydney` | 69 | 6.43:1 | 6.43:1 | 0 |
| `/projects/gridwatch` | 31 | 6.43:1 | 6.43:1 | 0 |
| `/projects/groundtruth` | 31 | 6.43:1 | 6.43:1 | 0 |
| `/shelf` | 47 | 6.43:1 | 6.43:1 | 0 |
| `/lab` | 50 | 5.39:1 | 5.39:1 | 0 |

No text is below its threshold, and every figure equals the local measurement.

### Security headers, TLS and exposure (live)

| Check | Result |
|---|---|
| Required headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, HSTS) | 7 of 7 on `/`, the four `/projects/*` pages, `/lab`, `/shelf`, `/robots.txt`, `/sitemap.xml` and the 404 page |
| `X-Powered-By` | absent |
| HSTS | `max-age=63072000` (still no `includeSubDomains` or `preload`) |
| CSP | unchanged from the first measurement; scripts and styles still allow `'unsafe-inline'` |
| TLS | 1.3 and 1.2 accepted; 1.0 and 1.1 rejected; certificate verifies, Let's Encrypt, expires 2027-01-21 |
| Redirects | `http://www`, `http://` apex, `https://` apex and `aravind-ad.vercel.app` end on `https://www.aravindd.com/` with 200 in 1 to 2 hops; `/rentlens` ends on `/projects/rentlens` in 1 hop |
| Sensitive paths (`/.env`, `/.git/config`, `/package.json`, `/vercel.json`, `/next.config.mjs`, `/tsconfig.json`, `/LICENSE`, `/src/app/page.tsx`) | all 404 |
| Source maps for the home page's JavaScript chunks | 403 |
| External hosts in page HTML | `www.aravindd.com`, `github.com`, `aravind2405.github.io`, `www.linkedin.com`, `data.nsw.gov.au` |

Full output: [`headers-live-redesign.txt`](measurements/2026-10-24/headers-live-redesign.txt).

### Abuse-protection challenge during this measurement

A burst of requests from this machine within about two minutes (28 page loads of roughly 20 requests each from the axe and contrast scans, then two runs of the header script of about 70 requests each) made Vercel's automatic abuse protection answer with a "Security Checkpoint" page (HTTP 403, `x-vercel-mitigated: challenge`). It was first seen at about 13:31 and had cleared by about 13:44. It was answering this machine only, and the Vercel API reported no custom firewall configuration for the project, so it was the platform's default protection. Consequences:

- The axe and contrast results above were collected before it began; they scanned the real pages, which is confirmed because their pass counts and text-node counts equal the local runs exactly.
- The header output from the first two attempts was discarded because the page bodies it fetched were challenge pages. The recorded header output is from the paced re-run at 13:44.
- `check-headers.sh` now pauses 0.4 s between requests, and `run-lighthouse.sh` accepts `PAUSE` (set to 20 s for the live run) and waits while the site answers anything but 200. No waits were needed during the Lighthouse run.

### Status of the findings

| Finding | Status |
|---|---|
| Dashboard accessibility, best practices and SEO | Resolved (see the follow-up section above) |
| `/lab` contrast | Resolved: lowest ratio 5.39:1 |
| Missing security headers and iframe sandbox | Resolved earlier; still present on every page |
| HSTS short form on the custom domain | Open |
| CSP allows inline scripts and styles | Open (needed by Next.js hydration) |

## Redesign branch, local production build (2026-10-27)

What this is: the stacked redesign PRs (#14 to #19, measured at the top of the stack) built with `npm run build` and served with `npx next start -p 3700`, measured on the same machine as the 2026-10-24 baseline but against `localhost`, not the live site. Local numbers have no CDN or HTTP/2 and are not comparable with the live tables above. For a fair comparison, `main` at commit `0484e7b` was built and measured the same way (home page only).

Commands (setup as in "Reproduce"; scripts in `scripts/measure/`):

```bash
npm run build && npx next start -p 3700 &
BASE=http://127.0.0.1:3700 PAGES="/ /projects/rentlens /lab /shelf" TAG=redesign- bash run-lighthouse.sh   # 3 runs per page and form
python3 summarize-lighthouse.py                                                                          # run on a folder holding only these files
BASE=http://127.0.0.1:3700 PAGES="/ /projects/rentlens /lab /shelf" TAG=redesign node run-axe.mjs
BASE=http://127.0.0.1:3700 PAGES="/ /lab /shelf /projects/rentlens /projects/ontimesydney /projects/gridwatch /projects/groundtruth" TAG=redesign-final node check-contrast.mjs
```

Lighthouse (median of 3; one first mobile run of the home page returned `NO_NAVSTART`, a Lighthouse error, and was re-run). Lighthouse ran on commit `a1a21e3`, before a one-line colour fix to the Lab band eyebrow (below).

| Page | Form | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 98 | 100 | 100 | 100 | 0.75 s | 2.46 s | 7 ms | 0 | 249 KiB | 22 |
| `/projects/rentlens` | mobile | 98 | 100 | 100 | 100 | 0.76 s | 2.47 s | 4 ms | 0 | 309 KiB | 22 |
| `/lab` | mobile | 98 | 100 | 100 | 100 | 0.76 s | 2.46 s | 8 ms | 0 | 239 KiB | 20 |
| `/shelf` | mobile | 98 | 100 | 100 | 100 | 0.76 s | 2.46 s | 4 ms | 0 | 239 KiB | 20 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0.50 s | 0 ms | 0 | 256 KiB | 24 |
| `/projects/rentlens` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 309 KiB | 22 |
| `/lab` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.50 s | 0 ms | 0 | 239 KiB | 20 |
| `/shelf` | desktop | 100 | 100 | 100 | 100 | 0.20 s | 0.54 s | 0 ms | 0 | 239 KiB | 20 |

Same method on `main` (`0484e7b`), home page only: mobile 98 / 100 / 100 / 100, LCP 2.31 s, 224 KiB, 19 requests; desktop 100 / 100 / 100 / 100, LCP 0.50 s, 224 KiB, 19 requests. So the redesign costs about 0.15 s of mobile LCP, 25 KiB and 3 requests on the home page, with the same mobile score. Every page, before and after, transfers more than 200 KiB, which is over the 200 KB target for the redesign brief; the largest contributor has not been investigated.

axe-core 4.14.0 (final build, commit `ae4a099`): 0 violations on every page at 375 px and 1440 px. Passes 38 (`/`), 47 (`/projects/rentlens`), 40 (`/lab`), 38 (`/shelf`). Incomplete (axe could not decide): 1 on `/`, `/projects/rentlens` and `/lab`; 0 on `/shelf`.

Contrast (pixel sampling, final build): no text pair below its threshold on any of 7 pages at 375 px and 1440 px. Lowest ratio 6.31:1 (`/projects/rentlens`, desktop); `/lab` lowest 7.65:1.

Found while measuring:
- The new "Experiments" eyebrow on the dark Lab band inherited the dark grey eyebrow colour and measured 2.26:1. axe reported it only as "incomplete". Fixed (commit `ce11798`, now `#d3d7de`, the same as the band text).
- `check-contrast.mjs` now scrolls through the page first, because sections below the first screen start transparent and fade in once scrolled to; without that it flagged them at about 1:1. It scrolls with `behavior: 'instant'` because the site uses smooth scrolling.

Raw results are in `measurements/2026-10-27/`.

## Not measured

- Real-user (field) data such as Core Web Vitals from visitors. Lighthouse is lab data from one machine and location, so these scores are not a guarantee for visitors on slow devices or networks.
- Keyboard-only navigation and screen-reader testing. Automated tools find only some accessibility problems.
- Focus order. The skip link, keyboard operation of the shelf filters and the reduced-motion behaviour of the spring easings are covered by end-to-end tests, which record pass or fail rather than a measurement.
- Anything about the other projects in this workspace.

## Reproduce

```bash
mkdir -p /tmp/measure && cd /tmp/measure
npm init -y && npm install --save-exact lighthouse@13.5.0 axe-core@4.14.0 puppeteer-core@25.16.0
cp /path/to/ad-site/scripts/measure/* . && mkdir -p out
bash run-lighthouse.sh && node run-axe.mjs && bash check-headers.sh > out/headers.txt && python3 summarize-lighthouse.py
```

Set `CHROME_PATH` for `run-lighthouse.sh` and edit the `executablePath` in `run-axe.mjs` if Chrome is not at the macOS default location. Results will differ slightly from the table: Lighthouse varies between runs and the site may have changed.

## Hover shadows, cream bands and plain closing section, 2026-10-28

Measured 2026-10-28 from 00:18 to 00:29 AEDT against a local production build (`npm run build`, then `next start` on port 3114) of branch `style/hover-shadow`, which sits on `main` at `da47260` (PR 23). Local, not the live site, so comparable only with other local runs. Same machine, Chrome and tool versions as above. The scripts were run from a scratch copy that has `puppeteer-core` and `pngjs` installed.

```bash
export P="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /projects/groundtruth /shelf /lab"
BASE=http://127.0.0.1:3114 PAGES="$P" TAG=hover node run-axe.mjs                  # 00:21
BASE=http://127.0.0.1:3114 PAGES="$P" TAG=hover node check-contrast.mjs           # 00:22
BASE=http://127.0.0.1:3114 PAGES="/ /projects/rentlens /projects/ontimesydney /shelf /lab" TAG=hover- bash run-lighthouse.sh   # 00:23 to 00:28
npx playwright test                                                               # desktop Chrome
npx playwright test -c <config using devices['Pixel 7']>                          # phone, temporary config, not committed
```

| Check | Result |
|---|---|
| axe-core 4.14.0, 7 pages at 375 px and 1440 px (14 runs) | 0 violations in every run |
| Lowest text contrast, all 7 pages, both sizes | 6.73:1 (`/lab` 7.65:1); 0 elements below threshold |
| Lighthouse desktop, 5 pages, median of 3 | perf 100, a11y 100, best practices 100, SEO 100, LCP 0.50 to 0.51 s, TBT 0 ms, CLS 0 |
| Lighthouse mobile, 5 pages, median of 3 | perf 98, a11y 100, best practices 100, SEO 100, LCP 2.31 s (home) and 2.46 s (others), TBT 4 to 7 ms, CLS 0 |
| Transfer per page (local) | home 249 KiB, RentLens 309 KiB, others 239 to 241 KiB (still over the 200 KB target) |
| Horizontal overflow, 8 routes at 320, 375, 768 and 1280 px | none, after stacking the previous and next links below 480 px |
| Playwright, desktop Chrome | 52 of 52 passed |
| Playwright, Pixel 7 emulation | 51 of 52 passed; the failure is "the top bar stays in view while scrolling", which does not apply on phones because the header hides on scroll down by design |

One Lighthouse run (home, mobile, run 1) hit `NO_NAVSTART` and was re-run on the same build at 00:28. A first contrast run flagged `/lab` at 1.31:1 on the footer line "The main work is on the home page." That was the pale link underline (`--line`) being sampled as background on the dark page, and the same reading appears on the live site, so it predates this change. The underline colour is now derived from the text colour (`color-mix(in srgb, currentColor 35%, transparent)`), after which `/lab` reads 7.65:1.

## Calmer hover states, 2026-10-28

Measured 2026-10-28 at about 00:45 AEDT against a local production build (port 3115) of branch `style/calmer-hover`, on `main` at `ff9bf8a` (PR 24). Local, not live. Scripts run from the scratch copy used above.

```bash
export P="/ /projects/rentlens /projects/ontimesydney /projects/gridwatch /projects/groundtruth /shelf /lab"
BASE=http://127.0.0.1:3115 PAGES="$P" TAG=calm node run-axe.mjs
BASE=http://127.0.0.1:3115 PAGES="$P" TAG=calm node check-contrast.mjs
npx playwright test                                              # desktop Chrome
npx playwright test -c <config using devices['Pixel 7']>         # phone, temporary config, not committed
```

| Check | Result |
|---|---|
| axe-core, 7 pages at 375 px and 1440 px | 0 violations in all 14 runs |
| Lowest text contrast, all 7 pages, both sizes | 6.73:1 (`/lab` 7.65:1); 0 below threshold |
| Horizontal overflow, 8 routes at 320, 375, 768, 1280 px | none |
| Playwright, desktop Chrome | 52 of 52 passed |
| Playwright, Pixel 7 emulation | 51 of 52 passed; the failure is the desktop-only "top bar stays in view while scrolling" test (phones hide the header on scroll down by design) |

Lighthouse was not re-run: this change only edits colour and shadow rules in `global.css`, and the previous run on the same code path is recorded above.

## Hover limited to project cards and arrows, 2026-10-28

Measured 2026-10-28 at about 01:00 AEDT against a local production build (port 3116) of branch `style/hover-cards-only`, on `main` at `f5ff9e7` (PR 25). Local, not live. Same scripts and commands as the previous section, with `BASE=http://127.0.0.1:3116` and `TAG=cardsonly`.

| Check | Result |
|---|---|
| axe-core, 7 pages at 375 px and 1440 px | 0 violations in all 14 runs |
| Lowest text contrast, all 7 pages, both sizes | 6.73:1 |
| Playwright, desktop Chrome | 52 of 52 passed |
| Playwright, Pixel 7 emulation | 51 of 52 passed; the failure is the desktop-only "top bar stays in view while scrolling" test (phones hide the header on scroll down by design) |

Lighthouse and the overflow check were not re-run: the change only deletes hover rules from `global.css` and one unused token.

## Shelf removed, 2026-10-28

Measured 2026-10-28 at about 01:35 AEDT against a local production build (port 3117) of branch `chore/remove-shelf`, on `main` at `2f5d71d`. Local, not live. Scripts run from the scratch copy used above with `BASE=http://127.0.0.1:3117`, `TAG=noshelf` and the six remaining pages.

| Check | Result |
|---|---|
| axe-core, 6 pages at 375 px and 1440 px | 0 violations in all 12 runs |
| Lowest text contrast, all 6 pages, both sizes | 6.73:1; 0 below threshold |
| Horizontal overflow, 7 routes at 320, 375, 768, 1280 px | none |
| Internal links and anchors, crawled from 6 pages | 0 broken, 0 empty; 6 unique internal targets |
| `/shelf` | 308 permanent redirect to `/` |
| Sitemap | 6 URLs (was 7) |
| Vitest | 45 passed (was 47; two Shelf tests removed) |
| Playwright, desktop Chrome | 47 of 47 passed (was 52; Shelf tests removed, one redirect test added) |
| Playwright, Pixel 7 emulation | 46 of 47 passed; the failure is the desktop-only "top bar stays in view while scrolling" test (phones hide the header on scroll down by design) |

Lighthouse was not re-run: the change removes a page and its CSS and adds no code to the remaining pages. The dated measurements under `measurements/` and the earlier sections above still mention the Shelf as it was then and are left unchanged.

## Test tooling and CI gates, 2026-10-28

Measured 2026-10-28 at about 01:20 to 01:30 AEDT on a local production build of branch `test/ci-gates`. Local, not live; Lighthouse CI uses its own server on ports 3200 and 3201.

```bash
npm run build
npx playwright test                       # four projects: chromium and webkit, desktop 1440x900 and phone 390x844
npm run lighthouse                        # lhci autorun, mobile then desktop, 3 runs each, thresholds in lighthouserc.*.json
npm run check:privacy && npm run check:receipts && npm run check:hygiene
```

| Check | Result |
|---|---|
| Playwright, 4 projects (chromium desktop, chromium phone, WebKit desktop, WebKit phone) | 151 passed, 0 failed (axe and link crawl run once, in chromium desktop) |
| Vitest | 53 passed (includes the privacy and receipt script tests) |
| Lighthouse CI mobile, home and `/projects/rentlens`, median of 3 | perf 98, a11y 100, best practices 100, SEO 100, CLS 0, LCP 2.46 s and 2.47 s |
| Lighthouse CI desktop, same pages, median of 3 | perf 100, a11y 100, best practices 100, SEO 100, CLS 0, LCP 0.50 s |
| Privacy check on the build | 141 built files scanned, no email-shaped text |
| Receipt check on site copy | passes; allowlisted numbers are 2026, 2027 and 4.0, each with a reason |
| Production dependency audit | 0 vulnerabilities |

WebKit note: the production CSP has `upgrade-insecure-requests`, which WebKit applies even to plain `http://127.0.0.1`, so pages never hydrate in a local WebKit run. The test fixture removes only that directive from responses in WebKit runs; production headers are unchanged and covered by `src/config.test.ts`. Playwright's request interception also stalls on redirects in WebKit, so the two redirect tests check the 308 and `Location` in every browser and drive the page-level redirect in Chromium only.

## Home page noise removed, 2026-10-28

Measured 2026-10-28 at about 02:10 AEDT on a local production build (port 3119) of branch `chore/home-noise`, stacked on `test/ci-gates`. Local, not live. Scripts run from the scratch copy used above, `BASE=http://127.0.0.1:3119`, `TAG=noise`, six pages.

| Check | Result |
|---|---|
| axe-core, 6 pages at 375 px and 1440 px | 0 violations in all 12 runs |
| Lowest text contrast, all 6 pages, both sizes | 6.73:1 |
| Horizontal overflow, 7 routes at 320, 375, 768, 1280 px | none |
| Vitest | 57 passed |
| Playwright, 4 projects (Chromium and WebKit, desktop and phone) | 159 passed, 0 failed |
| Unused CSS classes after the change | 0 (the unused `.h2-sm` rule was removed; `btn-ghost` and `pill-*` are built dynamically) |

Lighthouse was not re-run: the change only removes elements from the home page and card. The PR 37 CI gate runs it.

## Hero and projects band, 2026-10-28

Measured 2026-10-28 at about 02:50 AEDT on a local production build (ports 3122) of branch `feat/home-hero-projects`, stacked on `chore/home-noise`. Local, not live. Scripts run from the scratch copy used above with `TAG=bands`.

| Check | Result |
|---|---|
| Top edge of the first project card, 1440x900, Chromium and WebKit | 522 px from the top of the page (viewport 900 px); hero ends at 379 px |
| Top edge of the first project card, 390x844, Chromium and WebKit | 450 px (viewport 844 px); hero ends at 286 px |
| axe-core, 6 pages at 375 px and 1440 px | 0 violations in all 12 runs |
| Lowest text contrast, all 6 pages, both sizes | 6.68:1 (home) |
| Horizontal overflow, 7 routes at 320, 375, 768, 1280 px | none |
| Playwright, 4 projects | 171 passed, 0 failed |
| Vitest | 57 passed |

Measured with a Playwright script that reads `getBoundingClientRect().top` of `.project-card` after load (`scratchpad/fold.mjs`, not committed). Lighthouse is run by the CI gate on this PR.

## Lab band, contact band and sticky nav, 2026-10-28

Measured 2026-10-28 at about 03:30 AEDT on a local production build (port 3124) of branch `feat/home-lab-contact-nav`, stacked on `feat/home-hero-projects`. Local, not live. Scripts run from the scratch copy used above with `TAG=labnav`.

| Check | Result |
|---|---|
| axe-core, 6 pages at 375 px and 1440 px | 0 violations in all 12 runs (the home page is measured with reduced motion so no section is caught mid-fade) |
| Lowest text contrast, all 6 pages, both sizes | 6.68:1 (home); 0 elements below threshold, including the dark Lab band |
| Horizontal overflow, 7 routes at 320, 375, 768, 1280 px | none |
| Playwright, 4 projects | 187 passed, 0 failed |
| Vitest | 57 passed |

Lighthouse is run by the CI gate on this PR.
