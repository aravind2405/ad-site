#!/bin/bash
# Repo hygiene: no AI tool names or credit lines in tracked files or in this branch's commit messages.
# Usage: scripts/check-hygiene.sh [base-ref]   (base-ref defaults to origin/main)
set -u
pattern='claude|anthropic|chatgpt|openai'
base="${1:-origin/main}"
status=0

# This script and the CI workflow are excluded only because they name the pattern.
if git grep -n -i -E "$pattern" -- . ':!scripts/check-hygiene.sh'; then
  echo "Hygiene check failed: the text above is in tracked files." >&2
  status=1
fi

if git rev-parse --verify --quiet "$base" >/dev/null; then
  if git log "$base"..HEAD --format='%h %B' | grep -n -i -E "$pattern"; then
    echo "Hygiene check failed: the text above is in a commit message." >&2
    status=1
  fi
fi

[ "$status" -eq 0 ] && echo "Hygiene check passed."
exit "$status"
