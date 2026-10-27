#!/bin/bash
# Security header, redirect, TLS and exposed-path checks against the live site.
# Usage: bash check-headers.sh   (prints a plain-text report)
# PAUSE (seconds, default 0.4) spaces the requests out so Vercel's abuse protection is not triggered.
c() { sleep "${PAUSE:-0.4}"; curl "$@"; }
HOST=${HOST:-www.aravindd.com}
BASE=https://$HOST
REQUIRED="content-security-policy x-frame-options x-content-type-options referrer-policy permissions-policy cross-origin-opener-policy strict-transport-security"

echo "## headers per page (required: $REQUIRED)"
for p in "" projects/rentlens projects/ontimesydney projects/gridwatch projects/groundtruth lab robots.txt sitemap.xml does-not-exist; do
  H=$(c -sI "$BASE/$p" | tr -d '\r')
  missing=""
  for h in $REQUIRED; do echo "$H" | grep -qi "^$h:" || missing="$missing $h"; done
  echo "/$p | $(echo "$H" | head -1) | missing:${missing:- none}"
done

echo; echo "## header values (home)"
c -sI "$BASE/" | tr -d '\r' | egrep -i "^(content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-opener-policy|strict-transport-security|server|x-powered-by):"

echo; echo "## information leakage"
echo "x-powered-by header present: $(c -sI "$BASE/" | grep -ci '^x-powered-by:')"

echo; echo "## redirects (final status, final URL, hops)"
for u in http://www.aravindd.com/ http://aravindd.com/ https://aravindd.com/ https://aravind-ad.vercel.app/ https://www.aravindd.com/rentlens; do
  echo "$u -> $(c -sL -o /dev/null -w '%{http_code} %{url_effective} (%{num_redirects} hops)' $u)"
done

echo; echo "## TLS"
echo | openssl s_client -connect $HOST:443 -servername $HOST 2>/dev/null | egrep "Protocol  |Cipher    |Verify return code"
echo | openssl s_client -connect $HOST:443 -servername $HOST 2>/dev/null | openssl x509 -noout -subject -issuer -enddate
for v in tls1 tls1_1 tls1_2 tls1_3; do
  r=$(echo | openssl s_client -connect $HOST:443 -servername $HOST -$v 2>&1 | grep -E "Protocol  :" | head -1)
  echo "$v: ${r:-rejected}"
done

echo; echo "## sensitive paths (expect 404)"
for p in /.env /.env.local /.git/config /.vercel/project.json /package.json /vercel.json /next.config.mjs /tsconfig.json /LICENSE /src/app/page.tsx /_next/static/chunks/main.js.map; do
  echo "$p $(c -s -o /dev/null -w '%{http_code}' "$BASE$p")"
done

echo; echo "## source maps for JS chunks on the home page (expect 403/404)"
c -s "$BASE/" | grep -o '/_next/static/[^"]*\.js' | sort -u | head -5 | while read f; do echo "$f.map $(c -s -o /dev/null -w '%{http_code}' "$BASE$f.map")"; done

echo; echo "## CSP directives"
c -sI "$BASE/" | tr -d '\r' | grep -i '^content-security-policy:' | sed 's/^[^:]*: //' | tr ';' '\n' | sed 's/^ *//'

echo; echo "## external hosts referenced by page HTML (expect only the dashboard and links)"
for p in "" projects/rentlens projects/ontimesydney projects/gridwatch projects/groundtruth lab; do c -s "$BASE/$p"; done | grep -o 'https\?://[a-zA-Z0-9.-]*' | sort | uniq -c | sort -rn
