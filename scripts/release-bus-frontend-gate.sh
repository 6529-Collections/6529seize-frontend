#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SEIZE_BIN="${RELEASE_BUS_6529_BIN:-./bin/6529}"
EVIDENCE_TOOL="$SCRIPT_DIR/release-bus-gate-evidence.cjs"

cd "$REPO_ROOT"

run_unit_tests() {
  "$SEIZE_BIN" run test:no-coverage --runInBand --bail=0 "$@"
}

run_validation() {
  "$SEIZE_BIN" run lint
  "$SEIZE_BIN" run typecheck:ci
  run_unit_tests
}

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

record_phase_result() {
  local source="$1"
  local phase="$2"
  local status="$3"
  local duration_ms="$4"
  local exit_code="$5"
  local output_dir="$6"
  node "$EVIDENCE_TOOL" phase \
    --source "$source" \
    --name "$phase" \
    --status "$status" \
    --duration-ms "$duration_ms" \
    --exit-code "$exit_code" \
    --output "$output_dir/phase-$phase.json"
}

run_recorded_phase() {
  local source="$1"
  local phase="$2"
  local output_dir="$3"
  shift 3
  local started_at
  local completed_at
  local exit_code
  local status
  started_at="$(now_ms)"
  set +e
  "$@"
  exit_code=$?
  set -e
  completed_at="$(now_ms)"
  if [ "$exit_code" -eq 0 ]; then status=SUCCEEDED; else status=FAILED; fi
  record_phase_result \
    "$source" "$phase" "$status" "$((completed_at - started_at))" \
    "$exit_code" "$output_dir"
  return "$exit_code"
}

record_skipped_phase() {
  record_phase_result "$1" "$2" SKIPPED 0 0 "$3"
}

capture_manifest() {
  local source="$1"
  local scope="$2"
  local shard_index="$3"
  local shard_count="$4"
  local output_dir="$5"
  local raw_file="$output_dir/manifest-$scope-$shard_index-of-$shard_count.raw"
  local json_file="$output_dir/manifest-$scope-$shard_index-of-$shard_count.json"
  if [ "$scope" = all ]; then
    run_unit_tests --listTests > "$raw_file"
    node "$EVIDENCE_TOOL" manifest \
      --source "$source" --scope all --repo-root "$REPO_ROOT" \
      --raw "$raw_file" --output "$json_file"
  else
    run_unit_tests --listTests --shard="$shard_index/$shard_count" > "$raw_file"
    node "$EVIDENCE_TOOL" manifest \
      --source "$source" --scope shard --repo-root "$REPO_ROOT" \
      --shard-index "$shard_index" --shard-count "$shard_count" \
      --raw "$raw_file" --output "$json_file"
  fi
}

run_recorded_jest() {
  local source="$1"
  local shard_index="$2"
  local shard_count="$3"
  local output_dir="$4"
  local manifest="$output_dir/manifest-shard-$shard_index-of-$shard_count.json"
  local results="$output_dir/jest-results-$shard_index-of-$shard_count.json"
  local summary="$output_dir/jest-shard-$shard_index-of-$shard_count.json"
  local started_at
  local completed_at
  local exit_code
  capture_manifest "$source" shard "$shard_index" "$shard_count" "$output_dir"
  started_at="$(now_ms)"
  set +e
  run_unit_tests \
    --shard="$shard_index/$shard_count" \
    --json \
    --outputFile="$results"
  exit_code=$?
  set -e
  completed_at="$(now_ms)"
  node "$EVIDENCE_TOOL" jest \
    --source "$source" \
    --repo-root "$REPO_ROOT" \
    --results "$results" \
    --manifest "$manifest" \
    --shard-index "$shard_index" \
    --shard-count "$shard_count" \
    --duration-ms "$((completed_at - started_at))" \
    --exit-code "$exit_code" \
    --output "$summary"
  return "$exit_code"
}

run_serial_evidence_gate() {
  local output_dir="$1"
  mkdir -p "$output_dir"
  if ! run_recorded_phase legacy lint "$output_dir" "$SEIZE_BIN" run lint; then
    record_skipped_phase legacy typecheck "$output_dir"
    record_skipped_phase legacy build "$output_dir"
    return 1
  fi
  if ! run_recorded_phase legacy typecheck "$output_dir" "$SEIZE_BIN" run typecheck:ci; then
    record_skipped_phase legacy build "$output_dir"
    return 1
  fi
  capture_manifest legacy all 1 1 "$output_dir"
  if ! run_recorded_jest legacy 1 1 "$output_dir"; then
    record_skipped_phase legacy build "$output_dir"
    return 1
  fi
  run_recorded_phase legacy build "$output_dir" "$SEIZE_BIN" run build
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
  phase)
    if [ "$#" -ne 3 ] || ! [[ "$2" =~ ^(lint|typecheck|build)$ ]]; then
      echo "Usage: scripts/release-bus-frontend-gate.sh phase [lint|typecheck|build] OUTPUT_DIR" >&2
      exit 2
    fi
    mkdir -p "$3"
    case "$2" in
      lint) run_recorded_phase parallel lint "$3" "$SEIZE_BIN" run lint ;;
      typecheck) run_recorded_phase parallel typecheck "$3" "$SEIZE_BIN" run typecheck:ci ;;
      build) run_recorded_phase parallel build "$3" "$SEIZE_BIN" run build ;;
    esac
    ;;
  inventory)
    if [ "$#" -ne 2 ]; then
      echo "Usage: scripts/release-bus-frontend-gate.sh inventory OUTPUT_DIR" >&2
      exit 2
    fi
    mkdir -p "$2"
    capture_manifest parallel all 1 1 "$2"
    ;;
  jest)
    if [ "$#" -ne 4 ]; then
      echo "Usage: scripts/release-bus-frontend-gate.sh jest SHARD_INDEX SHARD_COUNT OUTPUT_DIR" >&2
      exit 2
    fi
    mkdir -p "$4"
    run_recorded_jest parallel "$2" "$3" "$4"
    ;;
  serial)
    if [ "$#" -ne 2 ]; then
      echo "Usage: scripts/release-bus-frontend-gate.sh serial OUTPUT_DIR" >&2
      exit 2
    fi
    run_serial_evidence_gate "$2"
    ;;
  *)
    echo "Usage: scripts/release-bus-frontend-gate.sh [contract|validate|full|phase|inventory|jest|serial]" >&2
    exit 2
    ;;
esac
