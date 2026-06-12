# Active Context

## Goal

Deliver P0/P1 JSON-LD structured data, raise a PR, and iterate available bot
feedback until the change is review-ready.

## Branch

`codex/json-ld-structured-data`

## Current Assumptions

- JSON-LD should be generated from the same server-side data used for route
  metadata where available.
- No new runtime dependency is required unless validation shows a typing gap.
- Profile schema must respect `ApiProfileClassification`; not every profile is
  a real-world `Person`.

## First File To Read After Compaction

`ops/workstreams/json-ld-structured-data/active-context.md`

## Next Actions

1. Build reusable JSON-LD renderer and schema builders.
2. Integrate P0 routes.
3. Integrate P1 routes.
4. Validate, commit, push, open PR, and inspect bot feedback.
