#!/usr/bin/env bash
# CI uses fixed ports: fail if occupied instead of searching for another port.
set -euo pipefail
case "${PORT:-}" in
  3101|3102|3103) ;;
  *) echo "Unexpected Museum CI port: ${PORT:-}" >&2; exit 1 ;;
esac

# Preserve the normal predev schema build when invoking Next directly.
./bin/6529 run build:env-schema
dev_args=(dev --port "$PORT")
if [ "${USE_TURBO:-}" = false ]; then dev_args+=(--webpack); fi
export __NEXT_EXPERIMENTAL_MCP_SERVER=true
exec ./bin/6529 exec next "${dev_args[@]}"
