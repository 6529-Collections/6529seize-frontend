#!/bin/bash

# Shared helpers for worktree management (VS Code + git hooks)
# Sourced by wt-add.sh and wt-sync.sh so behavior stays consistent.

setup_vscode_settings() {
  local worktree_path="$1"
  local vscode_path="$worktree_path/.vscode"
  local settings_file="$vscode_path/settings.json"

  # Keep existing color if present to avoid changing themes on sync runs.
  local colors=("red" "orange" "yellow" "green" "blue" "purple" "pink" "teal")
  local existing_color=""
  if [[ -f "$settings_file" ]]; then
    existing_color=$(grep -m1 '"titleBar.activeBackground"' "$settings_file" 2>/dev/null | sed -E 's/.*"titleBar.activeBackground"\s*:\s*"([^"]+)".*/\1/') || true
  fi
  # Validate extracted color is one of our known colors
  local valid_color=""
  for c in "${colors[@]}"; do
    if [[ "$existing_color" == "$c" ]]; then
      valid_color="$existing_color"
      break
    fi
  done
  local color=${valid_color:-${colors[$RANDOM % ${#colors[@]}]}}

  mkdir -p "$vscode_path"
  cat > "$settings_file" <<'EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "__COLOR__",
    "titleBar.inactiveBackground": "__COLOR__"
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
  "files.eol": "\\n",
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
  sed -i '' "s/__COLOR__/$color/g" "$settings_file"

  printf "%s" "$color"
}

setup_precommit_hook() {
  local worktree_path="$1"
  local hooks_path="$worktree_path/.hooks"

  mkdir -p "$hooks_path"
  cat > "$hooks_path/pre-commit" <<'HOOK'
#!/bin/sh
if [ "$SKIP_LINT" = "1" ]; then
  echo "Skipping lint (SKIP_LINT=1)"
  exit 0
fi
npm run format:uncommitted
git add -u
npm run lint:uncommitted:tight
HOOK
  chmod +x "$hooks_path/pre-commit"

  git -C "$worktree_path" config extensions.worktreeConfig true
  git -C "$worktree_path" config --worktree core.hooksPath .hooks
}

