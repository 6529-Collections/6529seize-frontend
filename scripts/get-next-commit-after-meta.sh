#!/usr/bin/env bash
set -euo pipefail

META_FILE="docs/meta.json"

error() {
  printf '%s\n' "$1" >&2
}

if [ ! -r "$META_FILE" ]; then
  error "Missing or unreadable ${META_FILE}."
  exit 1
fi

parse_with_jq() {
  jq -r '.last_commit // empty' "$META_FILE"
}

parse_with_python() {
  python3 - "$META_FILE" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as handle:
    data = json.load(handle)

value = data.get("last_commit", "")
print(value if isinstance(value, str) else "")
PY
}

last_commit=""
if command -v jq >/dev/null 2>&1; then
  if ! last_commit="$(parse_with_jq 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi
elif command -v python3 >/dev/null 2>&1; then
  if ! last_commit="$(parse_with_python 2>/dev/null)"; then
    error "Invalid JSON in ${META_FILE}."
    exit 1
  fi
else
  error "Cannot parse ${META_FILE}: install jq or python3."
  exit 1
fi

if [ -z "$last_commit" ]; then
  error "Missing or empty last_commit in ${META_FILE}."
  exit 1
fi

if ! git cat-file -e "${last_commit}^{commit}" 2>/dev/null; then
  error "last_commit '${last_commit}' not found in repository."
  exit 2
fi

if ! next_commit="$(git rev-list --first-parent --reverse "${last_commit}..HEAD" 2>/dev/null | sed -n '1p')"; then
  error "Failed to query git history."
  exit 4
fi

if [ -z "$next_commit" ]; then
  error "No newer commit exists after '${last_commit}'."
  exit 3
fi

printf '%s\n' "$next_commit"
