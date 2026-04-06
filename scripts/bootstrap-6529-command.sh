#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_BIN_DIR="${HOME}/.local/bin"
GLOBAL_6529="${LOCAL_BIN_DIR}/6529"
REAL_NPM=""
NPM_GLOBAL_BIN=""

print_export_only="0"
if [[ "${1:-}" == "--print-export" ]]; then
  print_export_only="1"
fi

log() {
  echo "$*" >&2
  return 0
}

resolve_real_binary() {
  local name="$1" varname="$2"
  local repo_bin="$REPO_ROOT/bin"
  local clean_path="" part

  IFS=':' read -r -a _rrb_parts <<< "${PATH:-}"
  for part in "${_rrb_parts[@]}"; do
    if [[ -z "$part" || "$part" == "$repo_bin" ]]; then
      continue
    fi
    clean_path="${clean_path:+${clean_path}:}${part}"
  done

  local resolved=""
  resolved="$(PATH="$clean_path" command -v "$name" 2>/dev/null || true)"
  if [[ -z "$resolved" ]]; then
    log "Cannot find real '$name' outside the repo's bin/ shims."
    exit 1
  fi

  printf -v "$varname" '%s' "$resolved"
  return 0
}

resolve_npm_global_bin() {
  if [[ -z "$REAL_NPM" ]]; then
    return 0
  fi

  NPM_GLOBAL_BIN="$("$REAL_NPM" bin -g 2>/dev/null || true)"
  if [[ -z "$NPM_GLOBAL_BIN" ]]; then
    local npm_global_prefix=""
    npm_global_prefix="$("$REAL_NPM" prefix -g 2>/dev/null || true)"
    if [[ -n "$npm_global_prefix" ]]; then
      NPM_GLOBAL_BIN="${npm_global_prefix}/bin"
    fi
  fi

  if [[ -n "$NPM_GLOBAL_BIN" && ! -d "$NPM_GLOBAL_BIN" ]]; then
    NPM_GLOBAL_BIN=""
  fi

  return 0
}

prepend_npm_global_bin_to_path() {
  if [[ -z "$NPM_GLOBAL_BIN" ]]; then
    return 0
  fi

  case ":$PATH:" in
    *":$NPM_GLOBAL_BIN:"*) ;;
    *) export PATH="$NPM_GLOBAL_BIN:$PATH" ;;
  esac

  return 0
}

ensure_socket_firewall() {
  resolve_real_binary npm REAL_NPM
  resolve_npm_global_bin
  prepend_npm_global_bin_to_path

  if command -v sfw >/dev/null 2>&1 && sfw --help >/dev/null 2>&1; then
    return 0
  fi

  if [[ "$print_export_only" == "1" ]]; then
    log "Socket Firewall ('sfw') is not installed or not usable on PATH."
    log "Run ./bin/6529 bootstrap first so it can install and wire up sfw."
    exit 1
  fi

  log "Installing Socket Firewall globally with the real npm binary..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    "$REAL_NPM" install --global sfw
  else
    local npm_global_prefix=""
    npm_global_prefix="$("$REAL_NPM" prefix -g 2>/dev/null || true)"
    if [[ -n "$npm_global_prefix" && -w "$npm_global_prefix" ]]; then
      "$REAL_NPM" install --global sfw
    else
      sudo "$REAL_NPM" install --global sfw
    fi
  fi

  resolve_npm_global_bin
  prepend_npm_global_bin_to_path

  if ! command -v sfw >/dev/null 2>&1 || ! sfw --help >/dev/null 2>&1; then
    log "Socket Firewall installation completed but 'sfw' is still not usable."
    exit 1
  fi
  return 0
}

ensure_pinned_pnpm() {
  log "Activating the repo-pinned pnpm version with Corepack..."
  bash "$REPO_ROOT/scripts/setup-corepack-pnpm.sh" >/dev/stderr
  return 0
}

ensure_socket_firewall
ensure_pinned_pnpm

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
if [ -d \"$NPM_GLOBAL_BIN\" ]; then
  case \":\$PATH:\" in
    *\":$NPM_GLOBAL_BIN:\"*) ;;
    *) export PATH=\"$NPM_GLOBAL_BIN:\$PATH\" ;;
  esac
fi
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
_6529_old_ifs="\$IFS"
IFS=:
set -- \$PATH
IFS="\$_6529_old_ifs"
for _6529_part in "\$@"; do
  if [ -z "\$_6529_part" ] || [ "\$_6529_part" = "\$_6529_old_repo_bin" ]; then
    continue
  fi
  if [ -z "\$_6529_clean_path" ]; then
    _6529_clean_path="\$_6529_part"
  else
    _6529_clean_path="\${_6529_clean_path}:\$_6529_part"
  fi
done
export PATH="\$_6529_clean_path"
unset _6529_old_repo_bin _6529_clean_path _6529_old_ifs _6529_part

if [ -d "$NPM_GLOBAL_BIN" ]; then
  case ":\$PATH:" in
    *":$NPM_GLOBAL_BIN:"*) ;;
    *) export PATH="$NPM_GLOBAL_BIN:\$PATH" ;;
  esac
fi

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

Socket Firewall is installed and available at:
  $(command -v sfw)

Pinned pnpm is active:
  $(pnpm --version)

Updated:
  $rc_file

Open a new shell, or run:
  source "$rc_file"

If you want a one-liner for the current shell:
  source <("$REPO_ROOT/bin/6529" bootstrap --print-export)

Then install project dependencies:
  6529 install

After that, these commands should resolve:
  6529 build
  6529 dev
EOF
