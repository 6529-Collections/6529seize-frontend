# Active Context

> Archive notice (2026-07-23): This is a historical snapshot. It is
> non-authoritative and must not be used as current status, branch, PR, release,
> security, or execution guidance. Start at `ops/workstreams/README.md` and
> verify current repository and GitHub state.

Last updated: 2026-06-18.

## Current Goal

Ship draft-only AI-agent affordances in the hidden profile CMS builder so users
can export schema/source packets, review BYO-agent patches, validate them
locally, and apply accepted changes only to the current draft.

## Constraints

- No model calls or paid inference.
- Agent output must never bypass validation, profile ownership checks, backend
  draft-save authority, or publish authority.
- Imported text is untrusted data. UI copy and docs must separate facts,
  authored copy, derived metadata, validation diagnostics, and agent notes.
- PR target remains `codex/profile-cms-builder-mvp`.

## First File To Read After Compaction

Read this file, then `run-log.md`, then the root `AGENTS.md`.

## Evidence Loaded

- Version-matched Next docs were read from `node_modules/next/dist/docs` after
  dependencies were installed:
  `01-app/01-getting-started/05-server-and-client-components.md`,
  `01-app/03-api-reference/01-directives/use-client.md`, and
  `01-app/01-getting-started/14-metadata-and-og-images.md`.
