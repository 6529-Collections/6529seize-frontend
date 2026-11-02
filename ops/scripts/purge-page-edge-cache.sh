#!/usr/bin/env bash
# Purges the frontend page distribution once a deployment answers with the new
# release, then waits until every edge location has dropped the old objects.
# Prerendered pages are cached at the edge for up to a day and reference the
# build that rendered them, so a deploy that skips this keeps serving them.
#
#   ops/scripts/purge-page-edge-cache.sh <distribution-id> <served-host>
#
# See ops/docs/developer/cloudfront-page-cache.md.
set -euo pipefail

distribution_id="${1:-}"
served_host="${2:-}"

[[ "$distribution_id" =~ ^E[A-Z0-9]{8,20}$ ]] || {
  echo "Invalid CloudFront distribution id: '$distribution_id'." >&2
  exit 1
}
[[ "$served_host" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] || {
  echo "Invalid served host: '$served_host'." >&2
  exit 1
}

# Refuse to purge a distribution that does not serve the deployed host, so a
# wrong id fails loudly instead of leaving the real cache stale.
aliases="$(aws cloudfront get-distribution \
  --id "$distribution_id" \
  --query 'Distribution.DistributionConfig.Aliases.Items' \
  --output text | tr '\t' '\n')"
if ! grep -qxF "$served_host" <<< "$aliases"; then
  echo "::error::Distribution $distribution_id does not serve $served_host." >&2
  exit 1
fi

invalidation_id="$(aws cloudfront create-invalidation \
  --distribution-id "$distribution_id" \
  --paths '/*' \
  --query Invalidation.Id \
  --output text)"
echo "Purging the $served_host edge cache: invalidation $invalidation_id on $distribution_id."

aws cloudfront wait invalidation-completed \
  --distribution-id "$distribution_id" \
  --id "$invalidation_id"
echo "Invalidation $invalidation_id completed."
