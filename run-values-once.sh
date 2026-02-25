#!/usr/bin/env bash
set -euo pipefail

values=(
  "029141607"
"be35743b7"
"30924cc31"
)

for ((i=${#values[@]}-1; i>=0; i--)); do
  codex exec -- "\$commit-docs-updater ${values[i]}"
  git add docs

  if git diff --cached --quiet; then
    echo "No docs changes for ${values[i]}; skipping commit."
  else
    codex exec -- "\$docs-precommit-guard ${values[i]}"
    git commit -m "docs updated for ${values[i]}"
  fi
done
