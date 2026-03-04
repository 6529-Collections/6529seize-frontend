#!/usr/bin/env bash
set -euo pipefail

export LC_ALL=C

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
META_FILE="$REPO_ROOT/docs/meta.json"

error() {
  printf '%s\n' "$1" >&2
}

read_last_target_from_meta() {
  jq -r '.docs_area_remediator_loop.last_target // empty' "$META_FILE" 2>/dev/null
}

run_monotonic_recovery_pass() {
  local target_path="$1"
  local target_area="$2"

  local monotonic_instruction=""
  monotonic_instruction=$(
    cat <<EOF
Use docs-area-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
Validator failed on monotonic-quality for docs/${target_area} because the area score regressed.
Primary objective: reduce docs/${target_area} quality score by resolving signals that increased it.
If merge/split candidates exist, merge or restructure micro-pages when they represent a single user journey.
Keep scope local to docs/${target_area} and related indexes, and keep links coherent.
EOF
  )
  codex exec -- "${monotonic_instruction}"

  local second_view_instruction=""
  second_view_instruction=$(
    cat <<EOF
Use docs-area-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
Perform a second-view refinement pass focused on monotonic-quality recovery for docs/${target_area}.
Finalize local structure and discoverability so quality score signals do not regress.
EOF
  )
  codex exec -- "${second_view_instruction}"
}

run_route_ownership_recovery_pass() {
  local target_path="$1"

  local remediation_instruction=""
  remediation_instruction=$(
    cat <<EOF
Use docs-route-ownership-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
Validator failed on route-ownership during strict global validation.
Resolve missing_owner_routes and stale_documented_routes by first fixing validator parsing/canonicalization issues, then remediating docs ownership sections only where still required.
Do not relax strict validation or skip route-ownership checks.
EOF
  )
  codex exec -- "${remediation_instruction}"

  local second_view_instruction=""
  second_view_instruction=$(
    cat <<EOF
Use docs-route-ownership-remediator.
Target file: ${target_path}
Run in strict stateless mode: do not rely on previous or next iterations.
Perform a second-view refinement pass for route-ownership remediation and ensure global strict validation can pass.
EOF
  )
  codex exec -- "${second_view_instruction}"
}

write_last_target_to_meta() {
  local target="$1"
  local tmp_meta_file="${META_FILE}.tmp"

  jq --indent 4 --arg target "$target" '.docs_area_remediator_loop.last_target = $target' "$META_FILE" > "$tmp_meta_file"
  mv "$tmp_meta_file" "$META_FILE"
}

max_iterations="${1:-0}"

if ! [[ "${max_iterations}" =~ ^[0-9]+$ ]]; then
  echo "Usage: $0 [max_iterations>=0]" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  error "jq is required."
  exit 1
fi

if [[ ! -r "$META_FILE" ]]; then
  error "Missing or unreadable ${META_FILE}."
  exit 1
fi

if ! jq empty "$META_FILE" >/dev/null 2>&1; then
  error "Invalid JSON in ${META_FILE}."
  exit 1
fi

if ! git diff --cached --quiet; then
  echo "ERROR: staged changes detected. Commit, stash, or unstage before running this loop." >&2
  exit 1
fi

pick_next_target() {
  local after="$1"
  local -a docs_files=()
  local candidate=""

  # macOS ships Bash 3.2 by default, which does not include `mapfile`.
  while IFS= read -r candidate; do
    docs_files+=("${candidate}")
  done < <(find docs -type f -name '*.md' | sort)

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
if ! last_target="$(read_last_target_from_meta)"; then
  error "Invalid JSON in ${META_FILE}."
  exit 1
fi
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
  iteration=$((iteration + 1))

  is_root_target=false
  target_area=""
  if [[ "${target_path}" == "docs/README.md" ]]; then
    is_root_target=true
  else
    target_area="${target_path#docs/}"
    target_area="${target_area%%/*}"
  fi

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

  if [[ "${is_root_target}" == "true" ]]; then
    git add docs
  else
    git add -A "docs/${target_area}" docs/README.md
  fi

  if git diff --cached --quiet; then
    echo "No docs changes for ${target_path}; continuing."
    write_last_target_to_meta "${target_path}"
    last_target="${target_path}"
    continue
  fi

  if [[ "${is_root_target}" == "true" ]]; then
    root_validation_output=""
    if ! root_validation_output="$(python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict --enforce-monotonic 2>&1)"; then
      printf '%s\n' "${root_validation_output}"
      if printf '%s\n' "${root_validation_output}" | grep -q "\\[route-ownership\\]"; then
        echo ""
        echo "Detected route-ownership validation failure; running auto-remediation."
        run_route_ownership_recovery_pass "${target_path}"
        git add docs
        python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict --enforce-monotonic
      else
        echo ""
        echo "Global validation failed."
        exit 1
      fi
    else
      printf '%s\n' "${root_validation_output}"
    fi
  else
    area_validation_output=""
    if ! area_validation_output="$(python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --area "${target_area}" --strict --enforce-monotonic 2>&1)"; then
      printf '%s\n' "${area_validation_output}"
      if printf '%s\n' "${area_validation_output}" | grep -q "stale-route signals"; then
        echo ""
        echo "Detected stale-route backlog in docs/${target_area}; running auto-remediation."
        python3 .codex/skills/docs-area-remediator/scripts/run_stale_route_remediation.py --area "${target_area}"
        git add -A "docs/${target_area}" docs/README.md
        python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --area "${target_area}" --strict --enforce-monotonic
      elif printf '%s\n' "${area_validation_output}" | grep -q "score regressed from"; then
        echo ""
        echo "Detected monotonic-quality regression in docs/${target_area}; running auto-remediation."
        run_monotonic_recovery_pass "${target_path}" "${target_area}"
        git add -A "docs/${target_area}" docs/README.md
        python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --area "${target_area}" --strict --enforce-monotonic
      else
        echo ""
        echo "Area validation failed for docs/${target_area}."
        exit 1
      fi
    else
      printf '%s\n' "${area_validation_output}"
    fi
  fi
  python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
  git commit -m "docs: remediator pass ${iteration} (${target_path})"
  write_last_target_to_meta "${target_path}"
  last_target="${target_path}"
done

if [[ "${run_final_validation}" == "true" ]]; then
  echo "=== Final global validation ==="
  final_validation_output=""
  if ! final_validation_output="$(python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict 2>&1)"; then
    printf '%s\n' "${final_validation_output}"
    if printf '%s\n' "${final_validation_output}" | grep -q "\\[route-ownership\\]"; then
      echo ""
      echo "Detected route-ownership validation failure; running auto-remediation."
      run_route_ownership_recovery_pass "docs/README.md"
      python3 .codex/skills/docs-area-remediator/scripts/validate_docs_optimizations.py --all --strict
    else
      echo ""
      echo "Final global validation failed."
      exit 1
    fi
  else
    printf '%s\n' "${final_validation_output}"
  fi
  python3 .codex/skills/commit-docs-updater/scripts/validate_docs_links.py
fi
