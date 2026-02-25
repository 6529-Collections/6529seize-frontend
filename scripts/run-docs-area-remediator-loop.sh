#!/usr/bin/env bash
set -euo pipefail

instruction='Use docs-area-remediator. Pick the next area and fix it end-to-end.'
max_iterations="${1:-20}"

if ! [[ "${max_iterations}" =~ ^[0-9]+$ ]] || [[ "${max_iterations}" -lt 1 ]]; then
  echo "Usage: $0 [max_iterations>=1]" >&2
  exit 1
fi

for ((i = 1; i <= max_iterations; i++)); do
  echo "=== Docs remediator pass ${i}/${max_iterations} ==="
  codex exec -- "${instruction}"

  git add docs

  if git diff --cached --quiet; then
    echo "No docs changes detected on pass ${i}; stopping loop."
    break
  fi

  codex exec -- "Use docs-area-remediator. Perform a second-view pass for staged docs optimizations: validate against real code and apply final adjustments."
  git add docs

  python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --staged --strict --enforce-monotonic
  python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
  git commit -m "docs: remediator pass ${i}"
done

echo "=== Final global validation ==="
python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict
python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
