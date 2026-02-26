#!/usr/bin/env bash
set -euo pipefail

export LC_ALL=C

max_iterations="${1:-0}"

if ! [[ "${max_iterations}" =~ ^[0-9]+$ ]]; then
  echo "Usage: $0 [max_iterations>=0]" >&2
  exit 1
fi

pick_next_target() {
  local after="$1"
  local -a docs_files=()
  local candidate=""

  mapfile -t docs_files < <(find docs -type f -name '*.md' | sort)

  if [[ "${#docs_files[@]}" -eq 0 ]]; then
    return 1
  fi

  if [[ -z "${after}" ]]; then
    printf '%s\n' "${docs_files[0]}"
    return 0
  fi

  for candidate in "${docs_files[@]}"; do
    if [[ "${candidate}" > "${after}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  printf '%s\n' "${docs_files[0]}"
}

iteration=0
last_target=""
run_final_validation=false

while true; do
  if [[ "${max_iterations}" -gt 0 && "${iteration}" -ge "${max_iterations}" ]]; then
    run_final_validation=true
    break
  fi

  if ! target_path="$(pick_next_target "${last_target}")"; then
    echo "No docs markdown files found under docs/. Stopping loop."
    break
  fi
  last_target="${target_path}"
  iteration=$((iteration + 1))

  if [[ "${max_iterations}" -gt 0 ]]; then
    echo "=== Docs remediator pass ${iteration}/${max_iterations} :: ${target_path} ==="
  else
    echo "=== Docs remediator pass ${iteration} :: ${target_path} ==="
  fi

  main_instruction=$(
    cat <<EOF
Use docs-area-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
First decide whether a bigger reorganization is needed (parent folder structure, index merge/split, or docs root structure). If needed, do that reorganization first.
Then ensure docs are fully up to date with actual user-facing code, fill undocumented gaps, and split/merge files or folders when needed.
Keep scope focused around this target and its parent structure.
Write concise, direct, user-facing language with logical reading flow from README to area pages.
EOF
  )
  codex exec -- "${main_instruction}"

  second_view_instruction=$(
    cat <<EOF
Use docs-area-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
Perform a second-view refinement for this target scope: finalize structure, readability, and coverage.
Ensure parent indexes and related links stay coherent after any split/merge/reorg changes.
Keep language short, concrete, and user-facing.
EOF
  )
  codex exec -- "${second_view_instruction}"

  git add docs

  if git diff --cached --quiet; then
    echo "No docs changes for ${target_path}; continuing."
    continue
  fi

  python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --staged --strict --enforce-monotonic
  python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
  git commit -m "docs: remediator pass ${iteration} (${target_path})"
done

if [[ "${run_final_validation}" == "true" ]]; then
  echo "=== Final global validation ==="
  python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict
  python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
fi
