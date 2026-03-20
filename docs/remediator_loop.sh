#!/usr/bin/env bash
set -euo pipefail

sleep_seconds="${1:-60}"

if ! [[ "${sleep_seconds}" =~ ^[0-9]+$ ]] || [[ "${sleep_seconds}" -lt 1 ]]; then
  echo "Usage: $0 [sleep_seconds>=1]" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit all changes before running remediator loop."
  exit 1
fi

instruction='Use input-docs-remediator.
Read docs/.remediator-loop.log.
Find next undocumented area from docs vs code.
Document exactly one area.
Append one line to docs/.remediator-loop.log as:
YYYY-MM-DDTHH:MM:SSZ | did: ... | next: ...
Keep it short and concrete.'

while true; do
  echo "=== docs remediator loop $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

  codex exec -- "${instruction}"

  git add docs

  if git diff --cached --quiet; then
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '%s | did: no docs changes this pass | next: retry next undocumented area scan\n' "${now}" >> docs/.remediator-loop.log
    echo "No docs changes detected; sleeping ${sleep_seconds}s."
    sleep "${sleep_seconds}"
    continue
  fi

  did_text="$(tail -n 1 docs/.remediator-loop.log | sed -E 's/^.*\| did:[[:space:]]*([^|]*).*$/\1/' | tr -d '\r')"
  if [[ -n "${did_text}" ]]; then
    commit_message="docs: ${did_text}"
  else
    commit_message='docs: remediator loop'
  fi

  commit_message="$(printf '%s' "${commit_message}" | cut -c1-72)"
  git commit -m "${commit_message}"

  echo "Committed: ${commit_message}"
  sleep "${sleep_seconds}"
done
