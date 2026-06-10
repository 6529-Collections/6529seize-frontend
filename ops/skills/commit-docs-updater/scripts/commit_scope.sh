#!/usr/bin/env bash
set -euo pipefail

target="${1:-HEAD}"
commit_ref="${target}^{commit}"

if ! git rev-parse --verify "${commit_ref}" >/dev/null 2>&1; then
  echo "ERROR: commit not found: ${target}" >&2
  exit 1
fi

full_commit="$(git rev-parse "${commit_ref}")"
short_commit="$(git rev-parse --short=12 "${commit_ref}")"
subject="$(git show -s --format=%s "${commit_ref}")"

printf "commit_full=%s\n" "${full_commit}"
printf "commit_short=%s\n" "${short_commit}"
printf "subject=%s\n\n" "${subject}"

echo "changed_files:"
git show --name-status --format= "${commit_ref}" | sed '/^[[:space:]]*$/d'

echo
echo "changed_top_level_dirs:"
git show --name-only --format= "${commit_ref}" \
  | sed '/^[[:space:]]*$/d' \
  | awk -F/ '{ if (NF == 1) print "."; else print $1 }' \
  | sort -u

echo
echo "changed_docs_files:"
git show --name-only --format= "${commit_ref}" \
  | sed '/^[[:space:]]*$/d' \
  | rg '^ops/docs/' || true
