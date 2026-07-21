#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

run_unit_tests() {
  ./bin/6529 run test:no-coverage --runInBand "$@"
}

run_validation() {
  ./bin/6529 run lint
  ./bin/6529 run typecheck:ci
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
    ./bin/6529 run build
    ;;
  *)
    echo "Usage: scripts/release-bus-frontend-gate.sh [contract|validate|full]" >&2
    exit 2
    ;;
esac
