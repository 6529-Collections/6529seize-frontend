#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 2 ]]; then
  echo "Usage: $0 [from-commit] [to-commit]" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  python3 scripts/docs-backfill-replay.py
  exit 0
fi

from_ref="${1}"
to_ref="${2:-HEAD}"
python3 scripts/docs-backfill-replay.py --from "${from_ref}" --to "${to_ref}"
