#!/usr/bin/env bash
#
# One-time provisioning for the AWS Device Farm project and device pools used
# by .github/workflows/device-farm-qa.yml. Idempotent: re-running it reuses
# existing resources instead of duplicating them.
#
# Run with credentials that may create Device Farm projects and device pools
# (e.g. from CloudShell or an admin profile):
#
#   bash ops/scripts/devicefarm-bootstrap.sh
#
# Names can be overridden to match the repository variables consumed by the
# workflow (vars.DEVICEFARM_PROJECT_NAME etc.):
#
#   DEVICEFARM_PROJECT_NAME=my-project bash ops/scripts/devicefarm-bootstrap.sh
#
# Full regime documentation: ops/docs/developer/device-farm-qa.md
set -euo pipefail

# AWS Device Farm is only available in us-west-2.
REGION="us-west-2"
PROJECT_NAME="${DEVICEFARM_PROJECT_NAME:-6529-mobile-qa}"
ANDROID_POOL_NAME="${DEVICEFARM_ANDROID_POOL_NAME:-android-phones-smoke}"
IOS_POOL_NAME="${DEVICEFARM_IOS_POOL_NAME:-ios-phones-web-smoke}"

project_arn="$(aws devicefarm list-projects --region "$REGION" \
  --query "projects[?name=='${PROJECT_NAME}'].arn | [0]" --output text)"
if [[ -z "$project_arn" || "$project_arn" == "None" ]]; then
  echo "Creating Device Farm project: ${PROJECT_NAME}"
  project_arn="$(aws devicefarm create-project --region "$REGION" \
    --name "$PROJECT_NAME" --query 'project.arn' --output text)"
else
  echo "Device Farm project already exists: ${PROJECT_NAME}"
fi
echo "  project ARN: ${project_arn}"

ensure_pool() {
  local name="$1"
  local max_devices="$2"
  local description="$3"
  local rules="$4"
  local arn

  arn="$(aws devicefarm list-device-pools --region "$REGION" \
    --arn "$project_arn" --type PRIVATE \
    --query "devicePools[?name=='${name}'].arn | [0]" --output text)"
  if [[ -z "$arn" || "$arn" == "None" ]]; then
    echo "Creating device pool: ${name} (max ${max_devices} devices)"
    arn="$(aws devicefarm create-device-pool --region "$REGION" \
      --project-arn "$project_arn" \
      --name "$name" \
      --description "$description" \
      --max-devices "$max_devices" \
      --rules "$rules" \
      --query 'devicePool.arn' --output text)"
  else
    echo "Updating device pool: ${name} (max ${max_devices} devices)"
    aws devicefarm update-device-pool --region "$REGION" \
      --arn "$arn" \
      --description "$description" \
      --max-devices "$max_devices" \
      --rules "$rules" \
      --query 'devicePool.arn' --output text > /dev/null
  fi
  echo "  pool ARN: ${arn}"
}

# Representative Android mix rather than "any available phone": a Samsung
# One UI flagship (the dominant real-world OEM skin), a stock-Android Pixel,
# and a mid-range A-series (the most common device class globally, lower
# perf tier). Whichever of the three are highly available get picked, up to
# the pool max. Model names must match the Device Farm public fleet exactly
# (`aws devicefarm list-devices`).
ANDROID_RULES='[
  {"attribute":"MODEL","operator":"IN","value":"[\"Samsung Galaxy S24\",\"Google Pixel 8\",\"Samsung Galaxy A15\"]"},
  {"attribute":"AVAILABILITY","operator":"EQUALS","value":"\"HIGHLY_AVAILABLE\""},
  {"attribute":"FLEET_TYPE","operator":"EQUALS","value":"\"PUBLIC\""}
]'

# Representative iOS mix: the current mainstream iPhone plus the small-screen
# SE on the oldest supported Safari — the 4.7" viewport is what makes the
# horizontal-overflow check meaningful.
IOS_RULES='[
  {"attribute":"MODEL","operator":"IN","value":"[\"Apple iPhone 16\",\"Apple iPhone SE (2022)\"]"},
  {"attribute":"OS_VERSION","operator":"GREATER_THAN_OR_EQUALS","value":"\"16\""},
  {"attribute":"AVAILABILITY","operator":"EQUALS","value":"\"HIGHLY_AVAILABLE\""},
  {"attribute":"FLEET_TYPE","operator":"EQUALS","value":"\"PUBLIC\""}
]'

ensure_pool "$ANDROID_POOL_NAME" 3 \
  "Representative Android mix: One UI flagship + stock Pixel + mid-range A-series" \
  "$ANDROID_RULES"
ensure_pool "$IOS_POOL_NAME" 2 \
  "Representative iOS mix: current mainstream + small-screen/oldest-Safari SE" \
  "$IOS_RULES"

cat <<SUMMARY

Device Farm provisioning complete.

The workflow resolves the project and pools by name, so no ARNs need to be
stored. If you used non-default names, set these repository variables:
  DEVICEFARM_PROJECT_NAME=${PROJECT_NAME}
  DEVICEFARM_ANDROID_POOL_NAME=${ANDROID_POOL_NAME}
  DEVICEFARM_IOS_POOL_NAME=${IOS_POOL_NAME}

Remaining setup (see ops/docs/developer/device-farm-qa.md):
  1. Create the CI IAM user/role with the documented Device Farm policy.
  2. Add repository secrets DEVICEFARM_AWS_ACCESS_KEY_ID and
     DEVICEFARM_AWS_SECRET_ACCESS_KEY.
  3. Add repository secret MOBILE_REPO_TOKEN (read access to
     6529-Collections/6529-core-mobile) for the native Android pack.
  4. Optionally add MOBILE_GOOGLE_SERVICES_JSON for Firebase push in QA builds.
SUMMARY
