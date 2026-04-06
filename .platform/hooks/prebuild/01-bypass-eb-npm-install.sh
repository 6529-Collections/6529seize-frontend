#!/usr/bin/env bash

set -euo pipefail

if [[ ! -f package.json ]]; then
  exit 0
fi

mv package.json package.json.seize-real

cat > package.json <<'EOF'
{
  "name": "6529-eb-noop-install",
  "private": true,
  "version": "1.0.0"
}
EOF
