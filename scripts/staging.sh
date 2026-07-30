#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

public_review_destinations_source="${PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE:-}"
unset PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE

if [[ -z "$public_review_destinations_source" ]] ||
  [[ ! -f "$public_review_destinations_source" ]] ||
  [[ ! -r "$public_review_destinations_source" ]]; then
  echo "A readable PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE is required." >&2
  exit 1
fi

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
./bin/6529 install:frozen

# Step 3: Rebuild the project
print_message "Rebuilding the project..."
BASE_ENDPOINT=https://staging.6529.io \
  ./bin/6529 run build

# Step 4: Prepare private runtime configuration
print_message "Preparing staging runtime configuration..."
runtime_secrets_dir="$REPO_ROOT/.next/runtime-secrets"
public_review_destinations_file="$runtime_secrets_dir/public-review-discussion-destinations.json"
install -d -m 700 "$runtime_secrets_dir"
install -m 600 \
  "$public_review_destinations_source" \
  "$public_review_destinations_file"
unset public_review_destinations_source
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to validate staging public-review configuration." >&2
  exit 1
fi
jq -e '
  type == "object" and
  has("staging") and
  (.staging | type == "object") and
  (.staging["stream-review"] | type == "string" and test("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")) and
  (has("production") | not)
' "$public_review_destinations_file" >/dev/null
expected_owner_group="$(id -un):$(id -gn)"
actual_owner_group="$(
  stat -c '%U:%G' "$runtime_secrets_dir" "$public_review_destinations_file" |
    sort -u
)"
if [[ "$actual_owner_group" != "$expected_owner_group" ]]; then
  echo "Staging runtime configuration ownership is invalid." >&2
  exit 1
fi
if [[ "$(stat -c '%a' "$runtime_secrets_dir")" != "700" ]] ||
  [[ "$(stat -c '%a' "$public_review_destinations_file")" != "600" ]]; then
  echo "Staging runtime configuration permissions are invalid." >&2
  exit 1
fi

# Step 5: Restart PM2 services
print_message "Restarting PM2 services..."
pm2 delete 6529seize >/dev/null 2>&1 || true
STANDALONE_ARTIFACT_PROFILE=staging \
PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE="$public_review_destinations_file" \
  pm2 start bash --name=6529seize -- \
  -lc "cd \"$REPO_ROOT\" && ./bin/6529 run start:standalone"
pm2 save >/dev/null 2>&1 || true

print_message "Update completed successfully!"
