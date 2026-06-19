# Phase 8 AI-Agent Affordances

## Charter

Build frontend and documentation affordances that let profile CMS authors bring
their own AI or local tools to inspect, patch, and validate draft CMS packages
without granting those tools publish authority.

## Branch

- Branch: `codex/cms-ai-agent-affordances-ui`
- Base: `codex/profile-cms-builder-mvp`
- Target PR branch: `codex/profile-cms-builder-mvp`

## Owned Paths

- `components/profile-cms-builder/`
- `lib/profile-cms/builder/`
- `__tests__/components/profile-cms-builder/`
- `__tests__/lib/profile-cms/builder/`
- `ops/workstreams/profile-native-cms-roadmap/`
- `ops/skills/` for the external-agent skill docs

## Boundaries

- Do not call AI models or add paid inference.
- Do not let imported patches save, validate on the backend, or publish without
  explicit user action.
- Keep backend write assumptions documented at the builder adapter boundary.
- Preserve existing V1 hash and validation semantics.

## Validation Bar

- Focused Jest coverage for export, patch review/apply, unsafe patch rejection,
  and ownership/auth boundaries.
- `seize run lint:changed`
- `seize run typecheck:changed`
- `seize run react-doctor:diff` when available
- Browser smoke when the local builder route can run.
