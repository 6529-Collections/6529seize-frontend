#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_MANAGER="$(
  node -e 'const pkg = require(process.argv[1]); if (!pkg.packageManager) process.exit(1); process.stdout.write(pkg.packageManager);' \
    "$REPO_ROOT/package.json"
)"

if [[ "$PACKAGE_MANAGER" != pnpm@* ]]; then
  echo "Expected packageManager to pin pnpm, found: $PACKAGE_MANAGER" >&2
  exit 1
fi

npm install --global corepack@latest
corepack enable pnpm
corepack prepare "$PACKAGE_MANAGER" --activate
pnpm --version
