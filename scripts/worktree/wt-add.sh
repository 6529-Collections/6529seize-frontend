#!/bin/bash
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

# 3. Set VS Code settings (keep existing color if present)
COLOR=$(setup_vscode_settings "$WORKTREE_PATH")
echo "VS Code color set to $COLOR."

# 4. Set up pre-commit hook
echo "Setting up pre-commit hook..."
setup_precommit_hook "$WORKTREE_PATH"
echo "Pre-commit hook configured."

# 5. Run npm install
echo "Running npm install in $WORKTREE_NAME..."
(cd "$WORKTREE_PATH" && npm install)

echo "✅ Worktree '$WORKTREE_NAME' is ready."
