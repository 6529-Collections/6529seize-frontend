#!/usr/bin/env bash
# Invoked under the workflow's existing 20-minute remaining-coverage deadline.
set -euo pipefail

case "${MUSEUM_PROJECT:-}" in
  web-desktop-chromium|web-mobile-chromium) ;;
  *) echo "Unexpected Museum project: ${MUSEUM_PROJECT:-}" >&2; exit 1 ;;
esac

rights_specs=()
remaining_specs=()
seen_specs=" "
for spec in "$@"; do
  if [[ "$seen_specs" == *" $spec "* ]]; then
    echo "Duplicate Museum spec: $spec" >&2
    exit 1
  fi
  seen_specs+="$spec "
  case "$spec" in
    tests/museum/rights-readonly.spec.ts) rights_specs+=("$spec") ;;
    tests/museum/about-readonly.spec.ts|tests/museum/data-architecture-readonly.spec.ts|tests/museum/inside-system-readonly.spec.ts|tests/museum/institutional-practice-readonly.spec.ts)
      remaining_specs+=("$spec") ;;
    *) echo "Unexpected Museum spec: $spec" >&2; exit 1 ;;
  esac
done
if [ "$#" -eq 0 ]; then
  echo "Museum remaining coverage requires selected specs." >&2
  exit 1
fi

museum_server_pid=""
cleanup_museum_server() {
  if [ -n "$museum_server_pid" ]; then
    local cleanup_exit=0
    # Defer cancellation until the entire owned group has been reaped.
    trap 'cleanup_exit=143' TERM
    trap 'cleanup_exit=130' INT
    # The wrapper spawns pnpm and Next children. Stop the entire owned session,
    # not only the wrapper, before allocating another compilation process.
    kill -TERM -- "-$museum_server_pid" 2>/dev/null || true
    for attempt in {1..5}; do
      if ! kill -0 -- "-$museum_server_pid" 2>/dev/null; then break; fi
      sleep 1 || true
    done
    kill -KILL -- "-$museum_server_pid" 2>/dev/null || true
    wait "$museum_server_pid" 2>/dev/null || true
    museum_server_pid=""
    trap 'exit 143' TERM
    trap 'exit 130' INT
    if [ "$cleanup_exit" -ne 0 ]; then exit "$cleanup_exit"; fi
  fi
}
trap cleanup_museum_server EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

run_phase() {
  local phase="$1" port="$2"
  shift 2
  # Never invoke Playwright with an empty selection: it would run all specs.
  if [ "$#" -eq 0 ]; then return 0; fi
  local base_url="http://localhost:$port"
  local server_log="test-results/app-pr-ci/museum-${phase}-server.log"
  local phase_log="test-results/app-pr-ci/museum-${phase}.log"
  local ready=false phase_exit
  local trace_args=(--trace=on-first-retry)
  if [ "$phase" = rights ]; then
    # Local, anonymous CI only. Remote staging/prod trace policy is unchanged.
    # Retries are disabled, so on-first-retry would never capture this failure.
    trace_args=(--trace=retain-on-failure)
  fi
  echo "Starting isolated Museum $phase phase on $MUSEUM_PROJECT"
  NEXT_DEV_DIST_DIR=".next-playwright-${MUSEUM_PROJECT}-${phase}" \
    BASE_ENDPOINT="$base_url" PORT="$port" \
    setsid bash scripts/museum-ci-dev.sh > "$server_log" 2>&1 &
  museum_server_pid="$!"
  for attempt in {1..120}; do
    if ! kill -0 "$museum_server_pid" 2>/dev/null; then
      cat "$server_log"
      echo "Museum $phase server exited before readiness for $MUSEUM_PROJECT." >&2
      return 1
    fi
    if curl --fail --silent --show-error --connect-timeout 2 --max-time 5 \
      "$base_url/museum/network/about" >/dev/null; then
      ready=true
      break
    fi
    sleep 1
  done
  if [ "$ready" != true ]; then
    cat "$server_log"
    echo "Museum $phase server did not become ready for $MUSEUM_PROJECT." >&2
    return 1
  fi
  set +e
  PLAYWRIGHT_SKIP_WEB_SERVER=1 BASE_ENDPOINT="$base_url" \
    PLAYWRIGHT_BASE_URL="$base_url" \
    PLAYWRIGHT_OUTPUT_DIR="test-results/playwright/museum-${phase}" \
    PLAYWRIGHT_HTML_REPORT_DIR="playwright-report/museum-${phase}" \
    ./bin/6529 exec playwright test "$@" \
      --project="$MUSEUM_PROJECT" --workers=1 --retries=0 --max-failures=1 \
      "${trace_args[@]}" 2>&1 \
    | sed -u "s/^/[museum $MUSEUM_PROJECT $phase] /" | tee "$phase_log"
  phase_exit="$?"
  set -e
  cleanup_museum_server
  if [ "$phase_exit" -ne 0 ]; then
    cat "$server_log"
    echo "Museum $phase phase failed with exit $phase_exit." >&2
    return "$phase_exit"
  fi
}

mkdir -p test-results/app-pr-ci
if [ "${#rights_specs[@]}" -gt 0 ]; then
  run_phase rights 3102 "${rights_specs[@]}"
fi
if [ "${#remaining_specs[@]}" -gt 0 ]; then
  run_phase remaining 3103 "${remaining_specs[@]}"
fi
