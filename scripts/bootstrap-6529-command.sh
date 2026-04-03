#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_BIN_DIR="${HOME}/.local/bin"
GLOBAL_6529="${LOCAL_BIN_DIR}/6529"

print_export_only="0"
if [[ "${1:-}" == "--print-export" ]]; then
  print_export_only="1"
fi

shell_name="${SHELL##*/}"
case "$shell_name" in
  zsh)
    rc_file="${HOME}/.zshrc"
    ;;
  bash|*)
    rc_file="${HOME}/.bashrc"
    ;;
esac

old_marker_begin="# >>> 6529 repo bin >>>"
old_marker_end="# <<< 6529 repo bin <<<"
new_marker_begin="# >>> 6529 command shim >>>"
new_marker_end="# <<< 6529 command shim <<<"

mkdir -p "$LOCAL_BIN_DIR"
mkdir -p "$(dirname "$rc_file")"
touch "$rc_file"

cat > "$GLOBAL_6529" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO_ROOT"
exec "$REPO_ROOT/bin/6529" "\$@"
EOF
chmod +x "$GLOBAL_6529"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

awk \
  -v old_begin="$old_marker_begin" \
  -v old_end="$old_marker_end" \
  -v new_begin="$new_marker_begin" \
  -v new_end="$new_marker_end" '
  $0 == old_begin { skipping = 1; next }
  $0 == old_end { skipping = 0; next }
  $0 == new_begin { skipping = 1; next }
  $0 == new_end { skipping = 0; next }
  !skipping { print }
' "$rc_file" > "$tmp_file"

block="$new_marker_begin
if [ -d \"$LOCAL_BIN_DIR\" ]; then
  case \":\$PATH:\" in
    *\":$LOCAL_BIN_DIR:\"*) ;;
    *) export PATH=\"$LOCAL_BIN_DIR:\$PATH\" ;;
  esac
fi
$new_marker_end"

printf '\n%s\n' "$block" >> "$tmp_file"
mv "$tmp_file" "$rc_file"

if [[ "$print_export_only" == "1" ]]; then
  cat <<EOF
_6529_old_repo_bin="$REPO_ROOT/bin"
_6529_clean_path=""
IFS=':' read -r -a _6529_path_parts <<< "\$PATH"
for _6529_part in "\${_6529_path_parts[@]}"; do
  if [[ -z "\$_6529_part" || "\$_6529_part" == "\$_6529_old_repo_bin" ]]; then
    continue
  fi
  if [[ -z "\$_6529_clean_path" ]]; then
    _6529_clean_path="\$_6529_part"
  else
    _6529_clean_path="\${_6529_clean_path}:\$_6529_part"
  fi
done
export PATH="\$_6529_clean_path"
unset _6529_old_repo_bin _6529_clean_path _6529_path_parts _6529_part

if [ -d "$LOCAL_BIN_DIR" ]; then
  case ":\$PATH:" in
    *":$LOCAL_BIN_DIR:"*) ;;
    *) export PATH="$LOCAL_BIN_DIR:\$PATH" ;;
  esac
fi
EOF
  exit 0
fi

cat <<EOF
Installed the global 6529 shim at:
  $GLOBAL_6529

Updated:
  $rc_file

Open a new shell, or run:
  source "$rc_file"

If you want a one-liner for the current shell:
  source <("$REPO_ROOT/bin/6529" bootstrap --print-export)

After that, these should resolve:
  6529 dev
  6529 build
  6529 staging

Fresh-clone-safe fallback remains:
  ./bin/6529 staging
EOF
