#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"

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

# 3. Set VS Code color randomly
VSCODE_PATH="$WORKTREE_PATH/.vscode"
mkdir -p "$VSCODE_PATH"

COLORS=("red" "orange" "yellow" "green" "blue" "purple" "pink" "teal")
RAND_COLOR=${COLORS[$RANDOM % ${#COLORS[@]}]}

cat > "$VSCODE_PATH/settings.json" <<EOF
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "$RAND_COLOR",
    "titleBar.inactiveBackground": "$RAND_COLOR"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },

  // --- Fixes on save ---
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll.eslint": "explicit"
  },

  // --- Search / Explorer excludes ---
  "files.exclude": {
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/dist": true,
    "**/build": true,
    "**/coverage": true,
    "**/.next": true,
    "**/generated": true
  },

  // --- File watcher excludes ---
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/*/**": true,
    "**/dist/**": true,
    "**/.next/**": true,
    "**/coverage": true,
    "**/generated": true
  },

  // --- Whitespace + EOL ---
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.trimTrailingWhitespace": true,
  "[markdown]": { "files.trimTrailingWhitespace": false },

  // --- TypeScript ---
  "typescript.preferences.importModuleSpecifier": "non-relative",

  // --- Tailwind IntelliSense (if using the extension) ---
  "tailwindCSS.experimental.classRegex": [
    "['\"`]([^'\"`]*tw-[^'\"`]*)['\"`]",
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cva\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
EOF
echo "VS Code color set to $RAND_COLOR."

# 4. Set up pre-commit hook
echo "Setting up pre-commit hook..."
mkdir -p "$WORKTREE_PATH/.hooks"
cat > "$WORKTREE_PATH/.hooks/pre-commit" <<'HOOK'
#!/bin/sh
if [ "$SKIP_LINT" = "1" ]; then
  echo "Skipping lint (SKIP_LINT=1)"
  exit 0
fi
npm run format:uncommitted
git add -u
npm run lint:uncommitted:tight
HOOK
chmod +x "$WORKTREE_PATH/.hooks/pre-commit"
git -C "$WORKTREE_PATH" config extensions.worktreeConfig true
git -C "$WORKTREE_PATH" config --worktree core.hooksPath .hooks
echo "Pre-commit hook configured."

# 5. Run npm install
echo "Running npm install in $WORKTREE_NAME..."
(cd "$WORKTREE_PATH" && npm install)

echo "✅ Worktree '$WORKTREE_NAME' is ready."
