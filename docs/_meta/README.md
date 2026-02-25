# Docs Metadata

Automation metadata for commit-driven docs maintenance.

## Overview

This area stores machine-managed cursor state used by
`scripts/docs-backfill-replay.py`.

Replay runs only when the git working tree is clean.

## Features

- [Commit Docs Backfill State](./commit-docs-backfill-state.json): persisted
  replay cursor (`last_processed_commit`) and traversal metadata (`mode`,
  `updated_at`, optional `notes`).

## Flows

- Backfill initialization:
  `python3 scripts/docs-backfill-replay.py --init <commit-ref>`
- Backfill replay:
  `python3 scripts/docs-backfill-replay.py`
- Replay preview without changing git state:
  `python3 scripts/docs-backfill-replay.py --dry-run`

## Troubleshooting

- If `last_processed_commit` is `null`, initialize the cursor before replay.
- If replay exits with `Working tree is not clean`, commit or stash local
  changes before rerunning.
- If replay stops on a conflict, resolve conflicts, then rerun from the saved cursor.

## Stubs

- No additional metadata assets are defined.

## Related Areas

- [Documentation Home](../README.md)
