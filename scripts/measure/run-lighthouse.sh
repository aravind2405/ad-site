#!/bin/bash
# Lighthouse, 3 runs per page for mobile (default preset) and desktop, JSON into ./out.
# Defaults reproduce the 2026-10-24 measurement of the live site.
# Override: BASE=https://example.com PAGES="/ /about" TAG=other- ./run-lighthouse.sh
export CHROME_PATH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
BASE="${BASE:-https://www.aravindd.com}"
PAGES="${PAGES:-/ /lab /shelf /rentlens}"
TAG="${TAG:-}"
mkdir -p out
for form in mobile desktop; do
  for page in $PAGES; do
    name=$([ "$page" = "/" ] && echo home || echo "${page#/}" | tr "/" "-")
    for n in 1 2 3; do
      extra=""; [ "$form" = desktop ] && extra="--preset=desktop"
      npx lighthouse "$BASE$page" $extra --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        --chrome-flags="--headless=new" \
        --output=json --output-path="out/lh-$TAG$name-$form-$n.json" >/dev/null 2>"out/lh-$TAG$name-$form-$n.err" \
        && echo "ok $TAG$name $form $n" || echo "FAILED $TAG$name $form $n"
    done
  done
done
echo "ALL DONE"
