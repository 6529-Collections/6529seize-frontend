#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$REPO_ROOT/bin"

shell_name="${SHELL##*/}"
case "$shell_name" in
  zsh)
    rc_file="${HOME}/.zshrc"
    ;;
  bash|*)
    rc_file="${HOME}/.bashrc"
    ;;
esac

marker_begin="# >>> 6529 repo bin >>>"
marker_end="# <<< 6529 repo bin <<<"

block="$marker_begin
if [ -d \"$BIN_DIR\" ]; then
  export PATH=\"$BIN_DIR:\$PATH\"
fi
$marker_end"

mkdir -p "$(dirname "$rc_file")"
touch "$rc_file"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

awk -v begin="$marker_begin" -v end="$marker_end" '
  $0 == begin { skipping = 1; next }
  $0 == end { skipping = 0; next }
  !skipping { print }
' "$rc_file" > "$tmp_file"

printf '\n%s\n' "$block" >> "$tmp_file"
mv "$tmp_file" "$rc_file"

cat <<EOF
Added the repo-local 6529 command to:
  $rc_file

Open a new shell, or run:
  source "$rc_file"

After that, plain repo commands should resolve:
  6529 dev
  6529 build
  6529 staging

Fresh-clone-safe fallback remains:
  ./bin/6529 staging
EOF
