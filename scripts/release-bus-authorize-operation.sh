#!/usr/bin/env bash
set -euo pipefail

payload="${1:-}"
api_url="${RELEASE_BUS_API_URL:-}"
auth_token="${RELEASE_BUS_WORKFLOW_AUTH_TOKEN:-}"

test -n "$payload"
jq -e 'type == "object"' <<< "$payload" >/dev/null
[[ "$api_url" =~ ^https://[A-Za-z0-9] ]]
test -n "$auth_token"

api_url="${api_url%/}"
response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

max_attempts=6
for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  http_status=""
  curl_status=0
  if http_status="$(curl --silent --show-error \
    --proto '=https' \
    --connect-timeout 10 \
    --max-time 30 \
    --output "$response_file" \
    --write-out '%{http_code}' \
    -H "Authorization: Bearer $auth_token" \
    -H 'Content-Type: application/json' \
    --data-binary "$payload" \
    "$api_url/deploy/release-bus/authorize")"; then
    curl_status=0
  else
    curl_status=$?
  fi

  if [ "$curl_status" -eq 0 ] && [[ "$http_status" =~ ^2[0-9]{2}$ ]]; then
    exit 0
  fi

  retryable=false
  if [ "$curl_status" -ne 0 ]; then
    retryable=true
  elif [[ "$http_status" =~ ^5[0-9]{2}$ ]] ||
    [ "$http_status" = 408 ] || [ "$http_status" = 429 ]; then
    retryable=true
  fi

  if [ "$retryable" != true ]; then
    echo "Release Bus authorization was rejected with HTTP ${http_status:-unknown}; not retrying." >&2
    exit 1
  fi
  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "Release Bus authorization transport failed after $max_attempts bounded attempts." >&2
    exit 1
  fi

  echo "Release Bus authorization transport attempt $attempt failed; retrying the same operation/run binding." >&2
  sleep 5
done
