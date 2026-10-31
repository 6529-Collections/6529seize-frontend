#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# Public package installation needs no token. Do not pass obsolete or unrelated
# package credentials to later build and runtime processes.
unset NODE_AUTH_TOKEN NPM_TOKEN

# Function to print messages
print_message() {
  echo
  echo "================================================================"
  echo "$1"
  echo "================================================================"
  echo
}



# Step 1: Pull
if [[ "${SKIP_STAGING_PULL:-0}" == "1" ]]; then
  print_message "Skipping pull..."
else
  git pull --ff-only
fi

# Step 2: Reinstall dependencies
print_message "Reinstalling dependencies..."
./bin/6529 ci

# Step 3: Rebuild the project
print_message "Rebuilding the project..."
# Other staging endpoints remain sourced from the established EC2 build environment.
BASE_ENDPOINT=https://staging.6529.io \
  ./bin/6529 run build

# Step 4: Restart PM2 services
print_message "Restarting PM2 services..."
pm2 delete 6529seize >/dev/null 2>&1 || true
pm2 start bash --name=6529seize -- \
  -lc "cd \"$REPO_ROOT\" && ./bin/6529 run start:standalone"
pm2 save >/dev/null 2>&1 || true

print_message "Update completed successfully!"
