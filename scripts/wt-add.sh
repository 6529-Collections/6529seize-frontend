#!/bin/bash
set -euo pipefail

# Usage: ./wt-add.sh <worktree-name> [base-ref] [branch-name]
if [ $# -lt 1 ]; then
  echo "Usage: $0 <worktree-name> [base-ref] [branch-name]"
  exit 1
fi

WORKTREE_NAME=$1
BASE_REF=${2:-$(git rev-parse --abbrev-ref HEAD)}
TARGET_BRANCH=${3:-$WORKTREE_NAME}

if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
  echo "Creating worktree '$WORKTREE_NAME' from existing branch '$TARGET_BRANCH'..."
  git worktree add "../$WORKTREE_NAME" "$TARGET_BRANCH"
else
  echo "Creating worktree '$WORKTREE_NAME' from '$BASE_REF' on new branch '$TARGET_BRANCH'..."
  git worktree add -b "$TARGET_BRANCH" "../$WORKTREE_NAME" "$BASE_REF"
fi

echo "✓ Branch '$TARGET_BRANCH' ready in worktree '$WORKTREE_NAME'."

# 2. Copy .env* files
echo "Copying .env* files..."
cp -v .env* "../$WORKTREE_NAME/" 2>/dev/null || echo "No .env files found."

# 3. Set VS Code color randomly
WORKTREE_PATH="../$WORKTREE_NAME/.vscode"
mkdir -p "$WORKTREE_PATH"

COLORS=("red" "orange" "yellow" "green" "blue" "purple" "pink" "teal")
RAND_COLOR=${COLORS[$RANDOM % ${#COLORS[@]}]}

cat > "$WORKTREE_PATH/settings.json" <<EOF
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "$RAND_COLOR",
    "titleBar.inactiveBackground": "$RAND_COLOR"
  }
}
EOF
echo "VS Code color set to $RAND_COLOR."

# 4. Run npm install
echo "Running npm install in $WORKTREE_NAME..."
(cd "../$WORKTREE_NAME" && npm install)

echo "✅ Worktree '$WORKTREE_NAME' is ready."
