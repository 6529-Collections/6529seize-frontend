#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit all changes before running docs update."
  exit 1
fi

LAST_COMMIT_HASH="$(git rev-parse --short HEAD)"

codex exec -- '$commit-docs-updater'

if [[ -z "$(git status --porcelain -- docs)" ]]; then
  echo "No docs changes; skipping commit."
  exit 0
fi

git add docs

codex exec -- '$docs-precommit-guard'
git commit -m "docs updated ${LAST_COMMIT_HASH}"
u
