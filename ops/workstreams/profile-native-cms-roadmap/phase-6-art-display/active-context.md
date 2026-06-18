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

## I18n Fallback Debt

- Touched surface: `components/profile-cms/CmsSiteRenderer.tsx`,
  `components/profile-cms/CmsArtLightbox.tsx`, and new `profileCms.*` message
  keys in `i18n/messages/en-US.ts`.
- Current fallback behavior: English CMS renderer labels remain the source of
  truth until locale packs add matching `profileCms.*` translations. New
  dimension, provider URI, signature, and source snapshot composites are
  interpolated messages so future locales can control word order.
- User impact: non-English locale QA may see English labels in profile CMS art,
  NFT detail, provenance, and inspection controls until the localization pass is
  scheduled.
- Follow-up issue: not yet filed; keep this debt tracked here until the
  localization owner opens a locale-pack follow-up for `profileCms.*`.

## Status

- Sonar duplication follow-up for PR #2734 is locally validated.
- Next action is to commit, push, and request `/6529bot followup`, then wait
  for fresh SonarCloud and bot signal on the new head.
