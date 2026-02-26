#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain -- . ':(exclude)docs')" ]]; then
  echo "Working tree has non-docs changes. Commit or stash them before running docs update."
  exit 1
fi

LAST_COMMIT_HASH="$(git rev-parse --short HEAD)"

codex exec -- '$commit-docs-updater'

if [[ -L docs ]]; then
  echo "docs is symlinked in this worktree; skipping git add/commit."
  exit 0
fi

if [[ -z "$(git status --porcelain -- docs)" ]]; then
  echo "No docs changes; skipping commit."
  exit 0
fi

git add docs

codex exec -- '$docs-precommit-guard'
git commit -m "docs updated ${LAST_COMMIT_HASH}"
