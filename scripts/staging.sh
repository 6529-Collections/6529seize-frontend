#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "NODE_AUTH_TOKEN is required for the private GitHub Package install." >&2
  exit 1
fi
package_auth_token="$NODE_AUTH_TOKEN"
unset NODE_AUTH_TOKEN

trusted_pnpm_binary="${SEIZE_STAGING_TRUSTED_PNPM_BINARY:-}"
unset SEIZE_STAGING_TRUSTED_PNPM_BINARY
trusted_node_binary="$(command -v node || true)"
trusted_sfw_binary="${SFW_BIN:-$(command -v sfw || true)}"
if [[ "$trusted_pnpm_binary" != /* ]] || [[ ! -x "$trusted_pnpm_binary" ]]; then
  echo "The 6529 wrapper must supply an absolute trusted pnpm binary." >&2
  exit 1
fi
if [[ "$trusted_node_binary" != /* ]] || [[ ! -x "$trusted_node_binary" ]]; then
  echo "An absolute executable Node.js binary is required for the secure install." >&2
  exit 1
fi
if [[ "$trusted_sfw_binary" != /* ]] || [[ ! -x "$trusted_sfw_binary" ]]; then
  echo "An absolute executable Socket Firewall binary is required for the secure install." >&2
  exit 1
fi

# Capture package tooling before the pull. The candidate checkout may change its
# own wrappers and helpers, so none of that post-pull code receives the token.
trusted_package_tooling_dir="$(mktemp -d "${TMPDIR:-/tmp}/6529-staging-package-tooling.XXXXXX")"
trusted_secure_pnpm="$trusted_package_tooling_dir/run-secure-pnpm.cjs"
trusted_routing_helper="$trusted_package_tooling_dir/run-pnpm-with-private-github-bypass.cjs"
trusted_policy_helper="$trusted_package_tooling_dir/private-github-packages-policy.cjs"

cleanup_trusted_package_tooling() {
  rm -f -- \
    "$trusted_secure_pnpm" \
    "$trusted_routing_helper" \
    "$trusted_policy_helper"
  rmdir -- "$trusted_package_tooling_dir"
}
trap cleanup_trusted_package_tooling EXIT

cp -- "$SCRIPT_DIR/run-secure-pnpm.cjs" "$trusted_secure_pnpm"
cp -- \
  "$SCRIPT_DIR/run-pnpm-with-private-github-bypass.cjs" \
  "$trusted_routing_helper"
cp -- "$SCRIPT_DIR/private-github-packages-policy.cjs" "$trusted_policy_helper"
chmod 500 \
  "$trusted_secure_pnpm" \
  "$trusted_routing_helper" \
  "$trusted_policy_helper"

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
NODE_AUTH_TOKEN="$package_auth_token" \
SFW_BIN="$trusted_sfw_binary" \
  "$trusted_node_binary" "$trusted_secure_pnpm" \
  --seize-secure-repository-root "$REPO_ROOT" \
  --seize-secure-pnpm-binary "$trusted_pnpm_binary" \
  -- install --frozen-lockfile
unset package_auth_token
cleanup_trusted_package_tooling
trap - EXIT

# Step 3: Rebuild the project
print_message "Rebuilding the project..."
# Other staging endpoints remain sourced from the established EC2 build environment.
BASE_ENDPOINT=https://staging.6529.io \
  ./bin/6529 run build

# Step 4: Prepare private runtime configuration
print_message "Preparing staging runtime configuration..."
runtime_secrets_dir="$REPO_ROOT/.next/runtime-secrets"
public_review_destinations_file="$runtime_secrets_dir/public-review-discussion-destinations.json"
./bin/6529 exec node scripts/public-review-discussion-destinations.cjs \
  --input source-file \
  --source "$public_review_destinations_source" \
  --destination "$public_review_destinations_file"
unset public_review_destinations_source

# Step 5: Restart PM2 services
print_message "Restarting PM2 services..."
pm2 delete 6529seize >/dev/null 2>&1 || true
STANDALONE_ARTIFACT_PROFILE=staging \
PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE="$public_review_destinations_file" \
  pm2 start bash --name=6529seize -- \
  -lc "cd \"$REPO_ROOT\" && ./bin/6529 run start:standalone"
pm2 save >/dev/null 2>&1 || true

print_message "Update completed successfully!"
