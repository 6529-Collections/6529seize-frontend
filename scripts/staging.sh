#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

public_review_destinations_b64="${PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64:-}"
unset PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64

if [[ -z "$public_review_destinations_b64" ]]; then
  echo "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64 is required." >&2
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
./bin/6529 run build

# Step 4: Prepare private runtime configuration
print_message "Preparing staging runtime configuration..."
runtime_secrets_dir="$REPO_ROOT/.next/runtime-secrets"
public_review_destinations_file="$runtime_secrets_dir/public-review-discussion-destinations.json"
install -d -m 700 "$runtime_secrets_dir"
if ! printf '%s' "$public_review_destinations_b64" | base64 -d \
  > "$public_review_destinations_file"; then
  echo "Public-review discussion destinations could not be decoded." >&2
  exit 1
fi
unset public_review_destinations_b64
chmod 600 "$public_review_destinations_file"
jq -e '
  type == "object" and
  has("staging") and
  (.staging | type == "object") and
  (.staging["stream-review"] | type == "string" and test("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")) and
  (has("production") | not)
' "$public_review_destinations_file" >/dev/null

# Step 5: Restart PM2 services
print_message "Restarting PM2 services..."
pm2 delete 6529seize >/dev/null 2>&1 || true
STANDALONE_ARTIFACT_PROFILE=staging \
PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE="$public_review_destinations_file" \
  pm2 start bash --name=6529seize -- \
  -lc "cd \"$REPO_ROOT\" && ./bin/6529 run start:standalone"
pm2 save >/dev/null 2>&1 || true

print_message "Update completed successfully!"
