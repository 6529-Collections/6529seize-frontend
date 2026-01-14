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
SYNC_CONF="$SCRIPT_DIR/sync.conf"
COPY_CONF="$SCRIPT_DIR/copy.conf"

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
        if [[ "$wt_path" != "$MAIN_REPO" ]]; then
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

# --- Create symlink ---
create_symlink() {
    local rel_path="$1"
    local worktree_path="$2"

    local source="$MAIN_REPO/$rel_path"
    local target="$worktree_path/$rel_path"

    # Check if source exists
    if [[ ! -e "$source" ]]; then
        log_verbose "  Source missing, skipping: $rel_path"
        return
    fi

    # Calculate relative path from target's parent to source
    local target_dir=$(dirname "$target")
    local relative_source="../$MAIN_REPO_NAME/$rel_path"

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
}

# --- Main ---
main() {
    parse_args "$@"

    log_info "Main repo: $MAIN_REPO"
    [[ $DRY_RUN -eq 1 ]] && log_warn "DRY RUN MODE"

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

    echo ""
    log_success "Done!"
}

main "$@"
