# Profile Native CMS

Status: active. Repository and GitHub state verified 2026-07-23.

This workstream covers the profile-native CMS implementation: versioned and
signed site packages, the profile CMS runtime, the feature-flagged builder, and
portable rendering for profile-owned websites.

Current delivery status and next actions live in
[Active Context](active-context.md). GitHub and the implementation remain the
source of truth if this index becomes stale.

## Current Source Of Truth

- Runtime route: `app/[user]/[...cmsPath]/page.tsx`
- Builder route: `app/[user]/cms/builder/page.tsx`
- Protocol and validation: `lib/profile-cms/protocol/v1/`
- Runtime, renderer, and 3D components: `components/profile-cms/`
- Builder components: `components/profile-cms-builder/`
- Frontend API boundaries: `lib/profile-cms/runtime/fetcher.ts` and
  `lib/profile-cms/builder/api.ts`
- Focused tests: `__tests__/lib/profile-cms/`,
  `__tests__/components/profile-cms/`,
  `__tests__/components/profile-cms-builder/`, and
  `__tests__/app/profile-cms-*.test.tsx`

## Active Reference Material

- [Phase 0 decision record](phase-0/decision-record.md)
- [Phase 0 test matrix](phase-0/test-matrix.md)
- [Phase 0 PR-wave design](phase-0/pr-wave-plan.md)
- [Phase 1 protocol foundation](phase-1/README.md)
- [Phase 1 schema index](phase-1/schema-index.md)
- [Phase 1 fixture corpus](phase-1/fixtures/README.md)
- [Phase 1 validation plan](phase-1/validation-plan.md)
- [Runtime bridge integration assumptions](runtime-bridge-integration-assumptions.md)
- [Builder integration assumptions](builder-mvp-integration-assumptions.md)
- [Product and technical roadmap](reference/product-technical-roadmap.md)
- [Art and NFT display reference](reference/art-nft-display-best-practices.md)

The Phase 1 schemas and fixtures are not archival documents. Current source and
tests import them directly, so their paths are part of the implementation
contract.

## Historical Material

Completed June planning lanes, manager logs, 3D/agent-affordance lane records,
and the old aggregate run log are preserved as non-authoritative history in
[the Profile Native CMS lane archive](../archive/2026-06/profile-native-cms-lanes/README.md).
