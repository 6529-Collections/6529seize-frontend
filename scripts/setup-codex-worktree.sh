#!/usr/bin/env bash

set -euo pipefail

# Codex setup output can be traced and its final environment can be captured.
# Disable tracing before reading the secret and keep it inside this process.
set +x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=./private-github-packages-auth.sh
source "$SCRIPT_DIR/private-github-packages-auth.sh"

load_private_package_auth_for_codex
exec "$REPO_ROOT/bin/6529" install
