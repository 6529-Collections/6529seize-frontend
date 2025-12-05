#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/find-long-files.sh <line-threshold> [--paths-only]

Lists files with more than <line-threshold> lines. Defaults to showing "lines<TAB>path".
Add --paths-only to print just the file paths.
Uses rg if available (respects .gitignore); falls back to find while pruning common generated folders.
EOF
}

paths_only=false
threshold=""

for arg in "$@"; do
  case "$arg" in
    --paths-only)
      paths_only=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$threshold" ]]; then
        threshold="$arg"
      else
        echo "Unexpected argument: $arg" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$threshold" ]] || [[ ! "$threshold" =~ ^[0-9]+$ ]]; then
  echo "Please provide a numeric line threshold." >&2
  usage
  exit 1
fi

emit_result() {
  local file="$1"
  local lines="$2"
  if $paths_only; then
    printf "%s\n" "$file"
  else
    printf "%s\t%s\n" "$lines" "$file"
  fi
}

process_files() {
  while IFS= read -r -d '' file; do
    # wc -l prints leading spaces; command substitution trims them.
    local lines
    lines=$(wc -l < "$file")
    if (( lines > threshold )); then
      emit_result "$file" "$lines"
    fi
  done
}

if command -v rg >/dev/null 2>&1; then
  rg --files -0 --glob '!**/__tests__/**' | process_files
else
  find . -type d \( \
    -name .git -o \
    -name node_modules -o \
    -name .next -o \
    -name coverage -o \
    -name dist -o \
    -name __tests__ \
  \) -prune -o -type f -print0 | process_files
fi
