#!/usr/bin/env bash

if [ -z "${BASH_VERSION:-}" ]; then
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

if git -C "$MAIN_REPO" show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
  echo "Creating worktree '$WORKTREE_NAME' from existing branch '$TARGET_BRANCH'..."
  git -C "$MAIN_REPO" worktree add "$WORKTREE_PATH" "$TARGET_BRANCH"
else
  echo "Creating worktree '$WORKTREE_NAME' from '$BASE_REF' on new branch '$TARGET_BRANCH'..."
  git -C "$MAIN_REPO" worktree add -b "$TARGET_BRANCH" "$WORKTREE_PATH" "$BASE_REF"
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
