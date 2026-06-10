#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain -- . ':(exclude)ops/docs')" ]]; then
  echo "Working tree has non-docs changes. Commit or stash them before running docs update."
  exit 1
fi

CODEX_ARGS=()
if [[ -L ops/docs ]]; then
  DOCS_REAL_PATH="$(cd ops/docs && pwd -P)"
  CODEX_ARGS+=(--add-dir "$DOCS_REAL_PATH")
fi

codex exec "${CODEX_ARGS[@]}" -- 'Use $commit-docs-updater. Context: ops/docs may be a symlink in this workflow, and that is expected.'

if [[ -L ops/docs ]]; then
  echo "ops/docs is symlinked in this worktree; skipping git add/commit."
  exit 0
fi

if [[ -z "$(git status --porcelain -- ops/docs)" ]]; then
  echo "No docs changes; skipping commit."
  exit 0
fi

git add ops/docs

codex exec "${CODEX_ARGS[@]}" -- 'Use $docs-precommit-guard. Context: ops/docs may be a symlink in this workflow, and that is expected.'
