#!/bin/bash
set -euo pipefail

# ============================================================
# wt-sync.sh - Sync files across git worktrees
# ============================================================
#
# Two modes:
#   1. Symlink (sync.conf) - Files shared everywhere
#   2. Copy (copy.conf) - Files copied once, then independent
#
# Usage:
#   ./scripts/worktree/wt-sync.sh [options] [worktree-name]
#
# Options:
#   -n, --dry-run    Show what would be done without making changes
#   -v, --verbose    Verbose output
#   -h, --help       Show this help message

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAIN_REPO_NAME="$(basename "$MAIN_REPO")"
MAIN_REPO_REALPATH="$(cd "$MAIN_REPO" && pwd -P)"
SYNC_CONF="$SCRIPT_DIR/sync.conf"
COPY_CONF="$SCRIPT_DIR/copy.conf"
COMMON_SH="$SCRIPT_DIR/wt-common.sh"

# --- Flags ---
DRY_RUN=0
VERBOSE=0
TARGET_WORKTREE=""

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_verbose() { [[ $VERBOSE -eq 1 ]] && echo -e "       $1" || true; }

if [[ ! -f "$COMMON_SH" ]]; then
    log_error "Missing helper script: $COMMON_SH"
    exit 1
fi
# shellcheck source=./wt-common.sh
source "$COMMON_SH"

show_help() {
    cat << EOF
Usage: $(basename "$0") [options] [worktree-name]

Sync files across git worktrees using symlinks or copies.

Options:
  -n, --dry-run    Show what would be done without making changes
  -v, --verbose    Verbose output
  -h, --help       Show this help message

Config files (in scripts/worktree/):
  sync.conf    Files to SYMLINK (shared everywhere)
  copy.conf    Files to COPY (independent per worktree)

Examples:
  $(basename "$0")              # Sync all worktrees
  $(basename "$0") my-feature   # Sync specific worktree
  $(basename "$0") -n           # Dry run
EOF
}

# --- Parse arguments ---
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--dry-run) DRY_RUN=1; shift ;;
            -v|--verbose) VERBOSE=1; shift ;;
            -h|--help) show_help; exit 0 ;;
            -*) log_error "Unknown option: $1"; show_help; exit 1 ;;
            *) TARGET_WORKTREE="$1"; shift ;;
        esac
    done
}

# --- Get list of worktrees (excluding main) ---
get_worktrees() {
    git -C "$MAIN_REPO" worktree list --porcelain | grep "^worktree " | cut -d' ' -f2- | while read -r wt_path; do
        local wt_real
        wt_real="$(cd "$wt_path" && pwd -P 2>/dev/null || echo "$wt_path")"
        if [[ "$wt_real" != "$MAIN_REPO_REALPATH" ]]; then
            echo "$wt_path"
        fi
    done
}

# --- Parse config file ---
parse_config() {
    local config_file="$1"

    if [[ ! -f "$config_file" ]]; then
        return
    fi

    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Trim whitespace
        line=$(echo "$line" | xargs)
        [[ -n "$line" ]] && echo "$line"
    done < "$config_file"
}

# --- Normalize relative path (drop trailing slash) ---
normalize_rel_path() {
    local rel_path="$1"
    # Remove trailing slash to avoid creating nested directories like ".dir/.dir"
    rel_path="${rel_path%/}"
    echo "$rel_path"
}

# --- Ensure source directories exist (and are not self-links) ---
ensure_source_dirs() {
    [[ ! -f "$SYNC_CONF" ]] && return

    while IFS= read -r rel_path; do
        [[ -z "$rel_path" ]] && continue
        # Only operate on entries that explicitly declare a directory (trailing slash)
        [[ "$rel_path" != */ ]] && continue

        local rel_norm
        rel_norm="$(normalize_rel_path "$rel_path")"
        local source_path="$MAIN_REPO/$rel_norm"

        # If it's a symlink, drop it so we can create a real directory
        if [[ -L "$source_path" ]]; then
            log_warn "Replacing self-link with directory: $rel_norm/"
            rm -f "$source_path"
        fi

        # Create directory if missing
        if [[ ! -d "$source_path" ]]; then
            mkdir -p "$source_path"
            log_info "Ensured source dir: $rel_norm/"
        fi
    done < <(parse_config "$SYNC_CONF")
}

# --- Create symlink ---
create_symlink() {
    local rel_path="$1"
    local worktree_path="$2"

    local rel_norm
    rel_norm="$(normalize_rel_path "$rel_path")"
    local source="$MAIN_REPO/$rel_norm"
    local target="$worktree_path/$rel_norm"

    # Check if source exists
    if [[ ! -e "$source" ]]; then
        log_verbose "  Source missing, skipping: $rel_path"
        return
    fi

    # Calculate relative path from target's parent to source
    local target_dir=$(dirname "$target")

    # Calculate relative path from target directory to source so nested worktrees work
    local relative_source
    if command -v python3 >/dev/null 2>&1; then
        relative_source=$(python3 - "$source" "$target_dir" <<'PY'
import os, sys
source = os.path.abspath(sys.argv[1])
target_dir = os.path.abspath(sys.argv[2])
print(os.path.relpath(source, target_dir))
PY
)
    elif command -v python >/dev/null 2>&1; then
        relative_source=$(python - "$source" "$target_dir" <<'PY'
import os, sys
source = os.path.abspath(sys.argv[1])
target_dir = os.path.abspath(sys.argv[2])
print(os.path.relpath(source, target_dir))
PY
)
    else
        log_error "python or python3 required to compute relative paths"
        exit 1
    fi

    # Already a correct symlink?
    if [[ -L "$target" ]]; then
        local current=$(readlink "$target")
        if [[ "$current" == "$relative_source" || "$current" == "$source" ]]; then
            log_verbose "  Already linked: $rel_path"
            return
        fi
    fi

    # Create parent directory if needed
    if [[ ! -d "$target_dir" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
            log_info "[DRY RUN] Would create dir: $target_dir"
        else
            mkdir -p "$target_dir"
        fi
    fi

    # Remove existing file/symlink
    if [[ -e "$target" || -L "$target" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
            log_info "[DRY RUN] Would remove: $target"
        else
            rm -rf "$target"
        fi
    fi

    # Create symlink
    if [[ $DRY_RUN -eq 1 ]]; then
        log_info "[DRY RUN] Would symlink: $rel_path -> $relative_source"
    else
        ln -s "$relative_source" "$target"
        log_success "Symlinked: $rel_path"
    fi
}

# --- Copy file (only if doesn't exist) ---
copy_file() {
    local rel_path="$1"
    local worktree_path="$2"

    local source="$MAIN_REPO/$rel_path"
    local target="$worktree_path/$rel_path"

    # Check if source exists
    if [[ ! -e "$source" ]]; then
        log_verbose "  Source missing, skipping: $rel_path"
        return
    fi

    # Skip if target already exists (preserve independent copies)
    if [[ -e "$target" && ! -L "$target" ]]; then
        log_verbose "  Already exists (keeping): $rel_path"
        return
    fi

    # If it's a symlink, remove it first (converting from symlink to copy)
    if [[ -L "$target" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
            log_info "[DRY RUN] Would remove symlink: $target"
        else
            rm "$target"
        fi
    fi

    # Create parent directory if needed
    local target_dir=$(dirname "$target")
    if [[ ! -d "$target_dir" ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
            log_info "[DRY RUN] Would create dir: $target_dir"
        else
            mkdir -p "$target_dir"
        fi
    fi

    # Copy
    if [[ $DRY_RUN -eq 1 ]]; then
        log_info "[DRY RUN] Would copy: $rel_path"
    else
        cp -r "$source" "$target"
        log_success "Copied: $rel_path"
    fi
}

# --- Sync a single worktree ---
sync_worktree() {
    local worktree_path="$1"
    local worktree_name=$(basename "$worktree_path")

    # Avoid syncing the main repo onto itself; that would create self-referential links
    if [[ "$worktree_path" == "$MAIN_REPO" ]]; then
        log_verbose "  Skipping main repo"
        return
    fi

    echo ""
    log_info "Syncing: $worktree_name"

    # Process symlinks
    if [[ -f "$SYNC_CONF" ]]; then
        local has_sync_entries=0
        while IFS= read -r rel_path; do
            [[ -z "$rel_path" ]] && continue
            has_sync_entries=1
            create_symlink "$rel_path" "$worktree_path"
        done < <(parse_config "$SYNC_CONF")

        if [[ $has_sync_entries -eq 0 ]]; then
            log_verbose "  No entries in sync.conf"
        fi
    else
        log_verbose "  No sync.conf found"
    fi

    # Process copies
    if [[ -f "$COPY_CONF" ]]; then
        local has_copy_entries=0
        while IFS= read -r rel_path; do
            [[ -z "$rel_path" ]] && continue
            has_copy_entries=1
            copy_file "$rel_path" "$worktree_path"
        done < <(parse_config "$COPY_CONF")

        if [[ $has_copy_entries -eq 0 ]]; then
            log_verbose "  No entries in copy.conf"
        fi
    else
        log_verbose "  No copy.conf found"
    fi

    # VS Code settings
    if [[ $DRY_RUN -eq 1 ]]; then
        log_info "[DRY RUN] Would ensure VS Code settings"
    else
        local color
        color=$(setup_vscode_settings "$worktree_path")
        log_success "VS Code settings ensured (title bar color: $color)"
    fi

    # Git hooks
    if [[ $DRY_RUN -eq 1 ]]; then
        log_info "[DRY RUN] Would install pre-commit hook"
    else
        setup_precommit_hook "$worktree_path"
        log_success "Pre-commit hook installed"
    fi
}

# --- Main ---
main() {
    parse_args "$@"

    log_info "Main repo: $MAIN_REPO"
    [[ $DRY_RUN -eq 1 ]] && log_warn "DRY RUN MODE"

    # Make sure directory sources listed in sync.conf actually exist in the main repo
    ensure_source_dirs

    if [[ -n "$TARGET_WORKTREE" ]]; then
        # Sync specific worktree
        local wt_path
        if [[ "$TARGET_WORKTREE" == /* ]]; then
            wt_path="$TARGET_WORKTREE"
        else
            wt_path="$(dirname "$MAIN_REPO")/$TARGET_WORKTREE"
        fi

        if [[ ! -d "$wt_path" ]]; then
            log_error "Worktree not found: $wt_path"
            exit 1
        fi

        sync_worktree "$wt_path"
    else
        # Sync all worktrees
        local worktrees=()
        while IFS= read -r wt; do
            [[ -n "$wt" ]] && worktrees+=("$wt")
        done < <(get_worktrees)

        if [[ ${#worktrees[@]} -eq 0 ]]; then
            log_warn "No worktrees found to sync"
            exit 0
        fi

        log_info "Found ${#worktrees[@]} worktree(s)"

        for wt_path in "${worktrees[@]}"; do
            sync_worktree "$wt_path"
        done
    fi

    # Re-ensure source directories in main haven't been turned into self-links
    ensure_source_dirs

    echo ""
    log_success "Done!"
}

main "$@"
