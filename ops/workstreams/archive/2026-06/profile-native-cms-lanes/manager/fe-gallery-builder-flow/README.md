# FE Gallery Builder Flow

> Archive notice (2026-07-23): This is a historical snapshot. It is
> non-authoritative and must not be used as current status, branch, PR, release,
> security, or execution guidance. Start at `ops/workstreams/README.md` and
> verify current repository and GitHub state.

## Charter

Own the Phase 5 frontend wallet-gallery builder lane stacked on
`codex/profile-cms-builder-mvp`.

## Owned Paths

- `components/profile-cms-builder/**`
- `lib/profile-cms/builder/**`
- `__tests__/components/profile-cms-builder/**`
- `__tests__/lib/profile-cms/builder/**`
- `ops/workstreams/profile-native-cms-roadmap/**` notes for this lane

## Constraints

- Keep the hidden route `/{handle}/cms/builder` feature-flagged.
- Use the existing `CmsSiteRenderer` for preview.
- Do not invent new V1 CMS package fields outside the existing schemas.
- Keep production publish blocked until signed storage and backend publish
  fields are available.
- Save and validate requests stay gated to the connected non-proxy owner.

## Validation Bar

- Focused Jest coverage for wallet input, snapshot adapter, hide/feature
  controls, preview generation, and auth gating.
- `seize run lint:changed`
- `seize run typecheck:changed`
- `seize run react-doctor:diff`
- Browser smoke when local app can run.
