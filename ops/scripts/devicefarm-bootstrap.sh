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

# Pools are STATIC (ARN-pinned, one exact device+OS each): a MODEL IN rule
# happily selects the same model on two OS versions and squeezes out the rest
# (observed live: two Pixel 8s / two iPhone 16s). Static pools take no
# --max-devices parameter.
ensure_pool() {
  local name="$1"
  local description="$2"
  local rules="$3"
  local arn

  arn="$(aws devicefarm list-device-pools --region "$REGION" \
    --arn "$project_arn" --type PRIVATE \
    --query "devicePools[?name=='${name}'].arn | [0]" --output text)"
  if [[ -z "$arn" || "$arn" == "None" ]]; then
    echo "Creating device pool: ${name}"
    arn="$(aws devicefarm create-device-pool --region "$REGION" \
      --project-arn "$project_arn" \
      --name "$name" \
      --description "$description" \
      --rules "$rules" \
      --query 'devicePool.arn' --output text)"
  else
    echo "Updating device pool: ${name}"
    aws devicefarm update-device-pool --region "$REGION" \
      --arn "$arn" \
      --description "$description" \
      --clear-max-devices \
      --rules "$rules" \
      --query 'devicePool.arn' --output text > /dev/null
  fi
  echo "  pool ARN: ${arn}"
}

# Representative Android devices rather than "any available phone": a Samsung
# One UI flagship (the dominant real-world OEM skin), a stock-Android Pixel,
# and a mid-range A-series (the most common device class globally, lower perf
# tier). Device ARNs are public-fleet identifiers (account-independent); a
# busy device makes the run queue for it rather than dropping coverage. If a
# device is retired from the fleet, re-resolve with:
#   aws devicefarm list-devices --region us-west-2 \
#     --query "devices[?model=='<model>'].{os:os,arn:arn}"
# Galaxy S24 / Android 14, Pixel 8 / Android 15, Galaxy A15 / Android 14.
# (The value must stay single-line: it is a JSON-encoded array inside a JSON
# string, and raw newlines inside a JSON string are invalid.)
ANDROID_RULES='[{"attribute":"ARN","operator":"IN","value":"[\"arn:aws:devicefarm:us-west-2::device:E0BD1EDDDF1B4E1A8FF5668759831BD6\",\"arn:aws:devicefarm:us-west-2::device:DE5BD47FF3BD42C3A14BF7A6EFB1BFE7\",\"arn:aws:devicefarm:us-west-2::device:9B74AD95597D4BF39827A4EAD83B9F6D\"]"}]'

# Representative iOS devices: the current mainstream iPhone plus the
# small-screen SE on the oldest supported Safari — the 4.7" viewport is what
# makes the horizontal-overflow check meaningful.
# iPhone 16 / iOS 18.6.2, iPhone SE 2022 / iOS 16.4.
IOS_RULES='[{"attribute":"ARN","operator":"IN","value":"[\"arn:aws:devicefarm:us-west-2::device:3D8FC46FCD034EF8B617E538C1651422\",\"arn:aws:devicefarm:us-west-2::device:9769808870C54DD798C7985DA7515A05\"]"}]'

ensure_pool "$ANDROID_POOL_NAME" \
  "Pinned representative Android devices: Galaxy S24 (14), Pixel 8 (15), Galaxy A15 (14)" \
  "$ANDROID_RULES"
ensure_pool "$IOS_POOL_NAME" \
  "Pinned representative iOS devices: iPhone 16 (18.6.2), iPhone SE 2022 (16.4)" \
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
