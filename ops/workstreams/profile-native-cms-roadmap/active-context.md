# Profile Native CMS Active Context

Last verified: 2026-07-23.

## Current State

Main contains the V1 protocol and semantic validator, the profile CMS runtime
route, the feature-flagged builder route, static rendering, 3D viewer/room
primitives, agent-oriented schema and patch surfaces, and focused unit and
component coverage.

The builder is not a generally available production publishing surface. Its
route remains feature-flagged, and main intentionally blocks production
publish where the backend contract or signing flow is incomplete.

The protocol schemas and fixtures under `phase-1/` are live inputs to source
and tests. Preserve their paths and validate changes against the consuming code.

## Open Frontend Delivery PRs

GitHub state was checked on 2026-07-23. These PRs contain work not present on
main and are not superseded:

| PR | Purpose | Relationship | Verified state |
| --- | --- | --- | --- |
| #3093 | Align the builder adapter with the backend contract | Base lane on `main` | Open; merge conflicts require refresh |
| #3094 | Convert static pages and establish the Capital pilot | Independent lane on `main` | Open; behind current main |
| #3096 | Add the signed publish flow | Stacked on #3093 | Open; clean against its stack base |
| #3098 | Add the backend-backed gallery generator and draft round trip | Stacked on #3093 | Open; clean against its stack base |

GitHub head/base state and the current diff take precedence over this table.

## Next Actions

1. Refresh #3093 on current main, resolve its adapter conflicts, and verify the
   real backend request/response contract.
2. Refresh #3094 independently and confirm its converted routes still match
   current application and help-corpus behavior.
3. Retarget or rebase #3096 and #3098 only after #3093 is current; then rerun
   their focused protocol, API, builder, and publish tests.
4. Keep the builder and write paths feature-flagged until the backend contract,
   wallet signing flow, storage receipts, and launch behavior are validated as
   one release set.

## Durable Product Constraints

- The normal profile page remains `/{handle}`; a published profile website is
  addressed below that profile, including `/{handle}/index.html`.
- Published artifacts are signed and content-addressed, with portable schemas
  and rendering rather than a frontend-only proprietary format.
- CDN delivery may accelerate artifacts but must not become the sole durable
  representation.
- The frontend must not simulate a successful production publish when the
  backend write/signing contract is unavailable.
- Public launch decisions about storage requirements, signing copy, and
  institutional migration scope require current product and backend evidence;
  the June planning archive is not authority for them.
