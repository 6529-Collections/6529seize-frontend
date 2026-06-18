# Active Context

Last updated: 2026-06-18.

## Current Goal

Improve the frontend CMS renderer's 2D art, gallery, NFT detail, media fallback,
and provenance presentation on branch `codex/cms-art-display-excellence`,
stacked on `codex/profile-cms-builder-mvp`.

## Owned Paths

- `components/profile-cms/`
- `__tests__/components/profile-cms/`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/`
- `ops/workstreams/profile-native-cms-roadmap/phase-6-art-display/`
- `i18n/messages/en-US.ts`

## Contract Notes

- No V1 schema fields are added.
- Gallery mode, traits, and collection context use existing permissive block
  extension fields.
- Source packet extension data remains optional and renderer-tolerant.

## Status

- Focused renderer and changed-file validation passed locally.
- Browser screenshot smoke was attempted but blocked by the local dependency
  junction shape, not by a tracked renderer error.
- Next action is to push a signed PR targeting `codex/profile-cms-builder-mvp`.
