#!/usr/bin/env bash
# Records a deployed commit as a Sentry release, the same three calls the
# withSentryConfig build plugin made before the build stopped baking the
# release into the client bundle (config/sentryBuildRelease.ts):
#   releases new <release>
#   releases set-commits <release> --auto --ignore-missing   (best effort)
#   releases finalize <release>
# Org, project and token come from SENTRY_ORG, SENTRY_PROJECT and
# SENTRY_AUTH_TOKEN. --auto reads the local git history and the origin remote.
#
# Best effort by design: any problem prints a warning and exits 0, so Sentry
# can never fail or hold up a deploy. Events still carry the release (the
# runtime sets it from VERSION), and Sentry creates a missing release from them.
#
# usage: sentry-release.sh <sentry-cli path> <release (40-hex commit SHA)>
set -uo pipefail

cli="${1:-}"
release="${2:-}"
command_timeout="${SENTRY_RELEASE_COMMAND_TIMEOUT:-120}"

warn() {
  echo "::warning::Sentry release ${release:-<none>}: $1"
}

run_cli() {
  timeout "$command_timeout" "$cli" "$@"
}

if ! [[ "$release" =~ ^[a-f0-9]{40}$ ]]; then
  warn "the release is not a commit SHA; skipped."
  exit 0
fi
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  warn "SENTRY_AUTH_TOKEN is not available; skipped."
  exit 0
fi
if [ -z "$cli" ] || [ ! -f "$cli" ]; then
  warn "the sentry-cli binary from the build is missing; skipped."
  exit 0
fi
chmod +x "$cli" 2>/dev/null || true

if ! run_cli releases new "$release"; then
  warn "could not create the release; Sentry will create it from the first event."
  exit 0
fi
# The build plugin treated commit association as optional as well.
if ! run_cli releases set-commits "$release" --auto --ignore-missing; then
  warn "could not associate commits with the release."
fi
if ! run_cli releases finalize "$release"; then
  warn "could not finalize the release."
  exit 0
fi
echo "Recorded Sentry release $release."
exit 0
