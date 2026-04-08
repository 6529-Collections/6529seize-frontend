#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REAL_NPM=""
NPM_GLOBAL_BIN=""
REMOVED_GLOBAL_SHIM="0"

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
  bash "$REPO_ROOT/scripts/setup-corepack-pnpm.sh" >&2
  return 0
}

remove_managed_global_shim() {
  local global_6529="${HOME}/.local/bin/6529"

  if [[ ! -e "$global_6529" ]]; then
    return 0
  fi

  if [[ -L "$global_6529" ]]; then
    local link_target=""
    link_target="$(readlink "$global_6529" 2>/dev/null || true)"
    if [[ "$link_target" == *"/bin/6529" ]]; then
      rm -f "$global_6529"
      REMOVED_GLOBAL_SHIM="1"
      return 0
    fi
  fi

  if [[ -f "$global_6529" ]] && grep -Fq '/bin/6529' "$global_6529"; then
    rm -f "$global_6529"
    REMOVED_GLOBAL_SHIM="1"
  fi

  return 0
}

emit_repo_shell_hook() {
  local sync_fn="$1"

  cat <<EOF
if [ -d "$NPM_GLOBAL_BIN" ]; then
  case ":\$PATH:" in
    *":$NPM_GLOBAL_BIN:"*) ;;
    *) export PATH="$NPM_GLOBAL_BIN\${PATH:+:\$PATH}" ;;
  esac
fi

${sync_fn}() {
  local _6529_clean_path="" _6529_part="" _6529_old_ifs=""
  _6529_old_ifs="\$IFS"
  IFS=:
  set -- \$PATH
  IFS="\$_6529_old_ifs"

  for _6529_part in "\$@"; do
    if [ -z "\$_6529_part" ] || [ "\$_6529_part" = "$REPO_ROOT/bin" ]; then
      continue
    fi

    if [ -z "\$_6529_clean_path" ]; then
      _6529_clean_path="\$_6529_part"
    else
      _6529_clean_path="\${_6529_clean_path}:\$_6529_part"
    fi
  done

  case "\${PWD}/" in
    "$REPO_ROOT/"*)
      if [ -n "\$_6529_clean_path" ]; then
        export PATH="$REPO_ROOT/bin:\$_6529_clean_path"
      else
        export PATH="$REPO_ROOT/bin"
      fi
      ;;
    *)
      export PATH="\$_6529_clean_path"
      ;;
  esac

  hash -r 2>/dev/null || true
}

${sync_fn}

if [ -n "\${ZSH_VERSION:-}" ]; then
  autoload -U add-zsh-hook 2>/dev/null || true
  if typeset -f add-zsh-hook >/dev/null 2>&1; then
    add-zsh-hook -D chpwd ${sync_fn} 2>/dev/null || true
    add-zsh-hook -D precmd ${sync_fn} 2>/dev/null || true
    add-zsh-hook chpwd ${sync_fn}
    add-zsh-hook precmd ${sync_fn}
  fi
elif [ -n "\${BASH_VERSION:-}" ]; then
  case ";\${PROMPT_COMMAND:-};" in
    *";${sync_fn};"*) ;;
    *)
      if [ -n "\${PROMPT_COMMAND:-}" ]; then
        PROMPT_COMMAND="${sync_fn};\${PROMPT_COMMAND}"
      else
        PROMPT_COMMAND="${sync_fn}"
      fi
      ;;
  esac
fi
EOF
}

ensure_socket_firewall
ensure_pinned_pnpm

repo_tag="$(printf '%s' "$REPO_ROOT" | cksum | awk '{print $1}')"
repo_marker_begin="# >>> 6529 repo command scope ${repo_tag} >>>"
repo_marker_end="# <<< 6529 repo command scope ${repo_tag} <<<"
sync_fn="_6529_sync_path_${repo_tag}"

if [[ "$print_export_only" == "1" ]]; then
  emit_repo_shell_hook "$sync_fn"
  exit 0
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
legacy_marker_begin="# >>> 6529 command shim >>>"
legacy_marker_end="# <<< 6529 command shim <<<"

mkdir -p "$(dirname "$rc_file")"
touch "$rc_file"
remove_managed_global_shim

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

awk \
  -v old_begin="$old_marker_begin" \
  -v old_end="$old_marker_end" \
  -v legacy_begin="$legacy_marker_begin" \
  -v legacy_end="$legacy_marker_end" \
  -v repo_begin="$repo_marker_begin" \
  -v repo_end="$repo_marker_end" '
  $0 == old_begin { skipping = 1; next }
  $0 == old_end { skipping = 0; next }
  $0 == legacy_begin { skipping = 1; next }
  $0 == legacy_end { skipping = 0; next }
  $0 == repo_begin { skipping = 1; next }
  $0 == repo_end { skipping = 0; next }
  !skipping { print }
' "$rc_file" > "$tmp_file"

block="$(emit_repo_shell_hook "$sync_fn")"

printf '\n%s\n%s\n%s\n' "$repo_marker_begin" "$block" "$repo_marker_end" >> "$tmp_file"
mv "$tmp_file" "$rc_file"

cat <<EOF
Socket Firewall is installed and available at:
  $(command -v sfw)

Pinned pnpm is active:
  $(pnpm --version)

Updated:
  $rc_file

The \`6529\` command is now repo-scoped for:
  $REPO_ROOT

Outside that directory tree, \`6529\` will not be on PATH.

Open a new shell, or run:
  source "$rc_file"

If you want a one-liner for the current shell:
  source <("$REPO_ROOT/bin/6529" bootstrap --print-export)

Then install project dependencies:
  6529 install
EOF

if [[ "$REMOVED_GLOBAL_SHIM" == "1" ]]; then
  cat <<EOF

Removed the old managed global shim:
  ${HOME}/.local/bin/6529
EOF
fi
