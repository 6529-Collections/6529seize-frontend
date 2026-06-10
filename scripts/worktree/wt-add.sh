#!/usr/bin/env bash

BASH_BIN="${BASH:-}"
BASH_BIN="${BASH_BIN##*/}"
if [ -z "${BASH_VERSION:-}" ] || [ -n "${POSIXLY_CORRECT:-}" ] || [ "$BASH_BIN" = "sh" ]; then
  unset POSIXLY_CORRECT
  exec bash "$0" "$@"
fi

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"
COMMON_SH="$SCRIPT_DIR/wt-common.sh"

if [[ ! -f "$COMMON_SH" ]]; then
  echo "Missing helper script: $COMMON_SH"
  exit 1
fi
# shellcheck source=./wt-common.sh
source "$COMMON_SH"

# Usage: ./scripts/worktree/wt-add.sh <worktree-name> [base-ref] [branch-name]
if [ $# -lt 1 ]; then
  echo "Usage: $0 <worktree-name> [base-ref] [branch-name]"
  exit 1
fi

ARG_COUNT=$#
WORKTREE_NAME=$1
WORKTREE_PATH="$PARENT_DIR/$WORKTREE_NAME"
BASE_REF=${2:-$(git -C "$MAIN_REPO" rev-parse --abbrev-ref HEAD)}
TARGET_BRANCH=${3:-$WORKTREE_NAME}
USER_SHELL="${SHELL:-}"
USER_SHELL="${USER_SHELL##*/}"

case "$USER_SHELL" in
  zsh)
    USER_RC_FILE="${HOME}/.zshrc"
    ;;
  bash|*)
    USER_RC_FILE="${HOME}/.bashrc"
    ;;
esac

strip_repo_bin_wrappers_from_path() {
  local input_path="${1:-${PATH:-}}"
  local clean_path="" part repo_root package_json old_ifs

  old_ifs="$IFS"
  IFS=:
  set -- $input_path
  IFS="$old_ifs"

  for part in "$@"; do
    if [[ -z "$part" ]]; then
      continue
    fi

    if [[ "$part" == */bin ]]; then
      repo_root="${part%/bin}"
      package_json="$repo_root/package.json"

      if [[ -f "$package_json" ]] &&
        grep -Fq '"name": "6529seize"' "$package_json" &&
        [[ -f "$part/6529" ]] &&
        [[ -f "$part/pnpm" ]]; then
        continue
      fi
    fi

    clean_path="${clean_path:+${clean_path}:}${part}"
  done

  printf '%s' "$clean_path"
}

branch_exists() {
  local branch="$1"
  git -C "$MAIN_REPO" show-ref --verify --quiet "refs/heads/$branch"
}

origin_branch_exists() {
  local branch="$1"
  git -C "$MAIN_REPO" show-ref --verify --quiet "refs/remotes/origin/$branch"
}

ref_sha() {
  local ref="$1"
  git -C "$MAIN_REPO" rev-parse --verify "$ref"
}

ensure_local_branch_matches_origin() {
  local branch="$1"

  if ! origin_branch_exists "$branch"; then
    return 0
  fi

  local local_sha origin_sha
  local_sha="$(ref_sha "refs/heads/$branch")"
  origin_sha="$(ref_sha "refs/remotes/origin/$branch")"

  if [[ "$local_sha" != "$origin_sha" ]]; then
    echo "Local branch '$branch' and 'origin/$branch' point to different commits."
    echo "  local:  ${local_sha:0:12}"
    echo "  origin: ${origin_sha:0:12}"
    echo "Refusing to guess which one you want."
    echo "Update, rename, or delete the local branch, then retry."
    exit 1
  fi
}

checked_out_worktree_for_branch() {
  local branch="$1"
  local wt_path="" wt_branch=""

  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      worktree\ *)
        wt_path="${line#worktree }"
        ;;
      branch\ refs/heads/*)
        wt_branch="${line#branch refs/heads/}"
        if [[ "$wt_branch" == "$branch" ]]; then
          printf '%s\n' "$wt_path"
          return 0
        fi
        ;;
    esac
  done < <(git -C "$MAIN_REPO" worktree list --porcelain)

  return 1
}

ensure_branch_available_for_worktree() {
  local branch="$1"
  local existing_worktree

  existing_worktree="$(checked_out_worktree_for_branch "$branch" || true)"
  if [[ -n "$existing_worktree" ]]; then
    echo "Branch '$branch' is already checked out at:"
    echo "  $existing_worktree"
    echo "Use that worktree, or remove it before creating another one."
    exit 1
  fi
}

ensure_worktree_path_available() {
  if [[ -e "$WORKTREE_PATH" ]]; then
    echo "Worktree path already exists:"
    echo "  $WORKTREE_PATH"
    echo "Choose another worktree name or remove that directory first."
    exit 1
  fi
}

ensure_worktree_parent_dir() {
  local worktree_parent
  worktree_parent="$(dirname "$WORKTREE_PATH")"

  if [[ ! -d "$worktree_parent" ]]; then
    mkdir -p "$worktree_parent"
  fi
}

fetch_origin() {
  if git -C "$MAIN_REPO" remote get-url origin >/dev/null 2>&1; then
    echo "Fetching origin..."
    git -C "$MAIN_REPO" fetch origin
  else
    echo "No origin remote found; checking local branches only."
  fi
}

add_default_worktree() {
  fetch_origin

  local has_local=0
  local has_origin=0

  if branch_exists "$TARGET_BRANCH"; then
    has_local=1
  fi

  if origin_branch_exists "$TARGET_BRANCH"; then
    has_origin=1
  fi

  if [[ $has_local -eq 1 ]]; then
    ensure_branch_available_for_worktree "$TARGET_BRANCH"
    ensure_local_branch_matches_origin "$TARGET_BRANCH"
  fi

  ensure_worktree_path_available

  if [[ $has_local -eq 1 ]]; then
    ensure_worktree_parent_dir
    echo "Creating worktree '$WORKTREE_NAME' from existing branch '$TARGET_BRANCH'..."
    git -C "$MAIN_REPO" worktree add "$WORKTREE_PATH" "$TARGET_BRANCH"
  elif [[ $has_origin -eq 1 ]]; then
    ensure_worktree_parent_dir
    echo "Creating worktree '$WORKTREE_NAME' from 'origin/$TARGET_BRANCH' on tracking branch '$TARGET_BRANCH'..."
    git -C "$MAIN_REPO" worktree add --track -b "$TARGET_BRANCH" "$WORKTREE_PATH" "origin/$TARGET_BRANCH"
  else
    ensure_worktree_parent_dir
    echo "Creating worktree '$WORKTREE_NAME' from '$BASE_REF' on new branch '$TARGET_BRANCH'..."
    git -C "$MAIN_REPO" worktree add -b "$TARGET_BRANCH" "$WORKTREE_PATH" "$BASE_REF"
  fi
}

add_advanced_worktree() {
  ensure_worktree_path_available

  if branch_exists "$TARGET_BRANCH"; then
    fetch_origin
    ensure_branch_available_for_worktree "$TARGET_BRANCH"
    ensure_local_branch_matches_origin "$TARGET_BRANCH"
    ensure_worktree_parent_dir
    echo "Creating worktree '$WORKTREE_NAME' from existing branch '$TARGET_BRANCH'..."
    git -C "$MAIN_REPO" worktree add "$WORKTREE_PATH" "$TARGET_BRANCH"
  else
    ensure_worktree_parent_dir
    echo "Creating worktree '$WORKTREE_NAME' from '$BASE_REF' on new branch '$TARGET_BRANCH'..."
    git -C "$MAIN_REPO" worktree add -b "$TARGET_BRANCH" "$WORKTREE_PATH" "$BASE_REF"
  fi
}

if [[ $ARG_COUNT -eq 1 ]]; then
  add_default_worktree
else
  add_advanced_worktree
fi

echo "✓ Branch '$TARGET_BRANCH' ready in worktree '$WORKTREE_NAME'."

# 2. Sync files (symlinks + copies from sync.conf and copy.conf)
echo "Syncing files..."
"$SCRIPT_DIR/wt-sync.sh" "$WORKTREE_NAME"

# 3. Bootstrap the repo-scoped 6529 command for this worktree
echo "Bootstrapping 6529 command in $WORKTREE_NAME..."
(
  cd "$WORKTREE_PATH"
  export PATH
  PATH="$(strip_repo_bin_wrappers_from_path)"
  ./bin/6529 bootstrap

  # Refresh this script's shell state so bare `6529` resolves immediately.
  BOOTSTRAP_EXPORTS_FILE="$(mktemp)"
  trap 'rm -f "$BOOTSTRAP_EXPORTS_FILE"' EXIT
  ./bin/6529 bootstrap --print-export > "$BOOTSTRAP_EXPORTS_FILE"
  # shellcheck disable=SC1090
  source "$BOOTSTRAP_EXPORTS_FILE"
  rm -f "$BOOTSTRAP_EXPORTS_FILE"
  trap - EXIT

  echo "Running secure install in $WORKTREE_NAME..."
  6529 install
)

echo "✅ Worktree '$WORKTREE_NAME' is ready."
echo
echo "Your current shell was not updated automatically."
echo "In your open terminal, run:"
echo "  cd \"$WORKTREE_PATH\" && source \"$USER_RC_FILE\""
echo
echo "Or activate this worktree immediately without reloading the full rc file:"
echo "  cd \"$WORKTREE_PATH\" && source <(./bin/6529 bootstrap --print-export)"
