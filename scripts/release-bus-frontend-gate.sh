#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SEIZE_BIN="${RELEASE_BUS_6529_BIN:-./bin/6529}"

cd "$REPO_ROOT"

run_unit_tests() {
  "$SEIZE_BIN" run test:no-coverage --runInBand "$@"
}

run_validation() {
  "$SEIZE_BIN" run lint
  "$SEIZE_BIN" run typecheck:ci
  run_unit_tests
}

case "${1:-full}" in
  contract)
    run_unit_tests --runTestsByPath __tests__/scripts/release-bus-frontend-gate.test.ts
    ;;
  validate)
    run_validation
    ;;
  full)
    run_validation
    "$SEIZE_BIN" run build
    ;;
  *)
    echo "Usage: scripts/release-bus-frontend-gate.sh [contract|validate|full]" >&2
    exit 2
    ;;
esac
