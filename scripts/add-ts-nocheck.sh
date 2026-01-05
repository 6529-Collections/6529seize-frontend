#!/usr/bin/env bash
set -euo pipefail

ROOT="generated"

if [ ! -d "$ROOT" ]; then
  exit 0
fi

find "$ROOT" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
  while IFS= read -r -d '' file; do
    if ! head -n 1 "$file" | grep -q '^// @ts-nocheck$'; then
      tmp="${file}.tmp"
      printf '%s\n' '// @ts-nocheck' > "$tmp"
      cat "$file" >> "$tmp"
      mv "$tmp" "$file"
    fi
  done
