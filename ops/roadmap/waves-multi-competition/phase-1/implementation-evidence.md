# Phase 1 Implementation and Validation Evidence

## Assessment

Roadmap Phase 1 implementation and local validation are complete on the
backend and frontend development branches. Repository delivery Phase 3 review,
checks, and staging deployment are in progress. The roadmap phase remains `In
progress`: its accepted exit criteria require a production shadow-sample
threshold, while this delivery is intentionally limited to staging and must not
deploy production.

This implementation uses the accepted Phase 0 decision register as its
baseline. D-05 remains deferred until the Phase 4 native-mutation gate, and
D-17 remains deferred until the Phase 6 presentation rollout gate.

## Source Baselines

- Backend main: `127c9409` (`6529seize-backend`)
- Frontend main: `ea5434e1a` (`6529seize-frontend`)
- Backend and frontend OpenAPI source SHA-256:
  `962a0090faf49732667e2b56c7af93cb106057502c87a47a2e5a5b2ac8fb5bb6`
- Frozen Phase 0 baselines: 296 mounted GET route shapes, 183 OpenAPI GET
  operations, and the accepted representative fixture matrix.

## Implemented Scope

The backend adds native competition, configuration-version, entry,
capability, lifecycle-event, vote, leaderboard, decision/winner, outcome and
distribution, pause, and parity-observation entities using central table
constants, UUID identities, millisecond times, additive indexes, and no
destructive migration. The migration loop idempotently establishes one stable
RFC UUIDv5 legacy-primary mapping per existing Rank/Approve wave and none for
Chat waves.

A unified competition service resolves immutable legacy adapters and native
repository readers without an active/current projection. Per-competition
storage and execution routing is shared by APIs and the decision/leaderboard
workers. Legacy mappings retain active worker ownership; native writes, native
execution, native hub creation, unified reads, and sampled shadow comparison
all have safe-off defaults. Shadow observations compare complete paged
configuration, entry/winner, vote/credit, leaderboard, decision, outcome,
distribution, pause, and capability snapshots and persist only identifiers,
categories, storage modes, configuration versions, and canonical hashes.

The OpenAPI-first `/v3/waves` read surface includes hub, competition
list/detail/version, entry/detail/vote, leaderboard, voter, decision, winner,
outcome/distribution, and pause resources with explicit bounds/defaults,
opaque filter-bound cursors, parent/child masking, and optional-auth
permissions. Backend routes/models and frontend models were regenerated from
the identical source. Production frontend code has no v3 competition imports,
requests, or navigation.

Permanent compatibility checks consume the Phase 0 machine snapshots in both
repositories. They retain all 296 mounted GET shapes and all 183 OpenAPI GET
operations, reachable schemas, authentication/cache classifications, old
generated wave/drop discriminators, native-hub Chat projection, immutable
legacy-primary selection, representative adapter fixtures, stable ordering,
pagination, ties, nullability, masking, and Main Stage capability mapping.

## Local Validation

All commands ran from clean task-specific worktrees on 2026-07-20.

### Backend

| Command | Result |
| --- | --- |
| `npm run check` | Passed Prettier, ESLint, 267 suites, 2,282 passing tests, one intentional skip, and TypeScript build. |
| `npm test -- --runInBand src/competitions/competition-page.test.ts src/competitions/competition.service.test.ts src/competitions/legacy-competition.adapter.integration.test.ts src/competitions/native-competition.reader.integration.test.ts` | Passed 4 suites and 14 focused service/adapter/repository paging tests. |
| `npm test -- --runInBand src/competitions/competition.repository.integration.test.ts` | Passed 4 mapping/schema/capability tests, including idempotent mapping and per-competition capability identity. |
| `(cd src/api-serverless && npm run build)` | Regenerated routes/models and produced the deployable API zip successfully. |

The full suite includes entity/repository/service/API/auth, stable ID,
zero/one/many mapping, immutable primary, native-hub, old contract,
legacy/native read, shadow normalization, worker-ownership, cursor, ordering,
tie, error, and capability coverage.

### Frontend

| Command | Result |
| --- | --- |
| `./bin/6529 run generate` | Regenerated approved API models from the backend OpenAPI source. |
| `./bin/6529 run lint:changed` | Passed. |
| `./bin/6529 run check` | Passed repository type and quality gates. |
| `./bin/6529 run test:no-coverage --runInBand` | Passed 2,030 suites and 12,005 tests with no snapshot failures. |
| `ALLOWLIST_API_ENDPOINT=http://127.0.0.1 API_ENDPOINT=http://127.0.0.1 BASE_ENDPOINT=http://127.0.0.1 IPFS_API_ENDPOINT=http://127.0.0.1 IPFS_GATEWAY_ENDPOINT=http://127.0.0.1 ./bin/6529 run build` | Passed OpenAPI generation, lint, Next.js production compile/typecheck/static generation, and sitemap generation. Localhost values satisfy required build-time endpoint validation without contacting an environment. |

## Zero-Downtime Delivery and Rollback

The staging order is additive schema first, then the two routing-aware legacy
workers with native ownership disabled, then the API with unified/native flags
off, and only then the frontend. The exact workflow runs and final heads will
be appended after staging delivery.

Rollback disables unified reads and shadow comparison, leaving every existing
GET and legacy worker path authoritative. Additive tables and stable mappings
remain in place; no rollback deletes schema or transfers worker ownership.

## Exit-Criteria Position

| Criterion | Evidence / state |
| --- | --- |
| Unified reads match the agreed fixture set | Met locally through golden legacy/native adapters, route/OpenAPI snapshots, and shadow comparator tests. |
| Production sample threshold | Pending a later authorized production rollout; production is explicitly out of scope for this delivery. |
| Frozen GET contracts pass for legacy and representative native projections | Met locally through the 296-route census, 183-operation/reachable-schema guard, fixture projections, and old generated-client checks. |
| No unexplained winner, vote, leaderboard, outcome, or capability mismatches | Met for the accepted synthetic fixtures; production observation window remains pending. |
| Old endpoints and workers remain behaviorally unchanged | Met locally; additive routes are flag-hidden and native worker ownership is disabled. Staging confirmation is pending. |
| Phase 2 can consume a stable contract without native writes | Met; generated frontend models compile and no UI consumes them. |

Later roadmap phases still own native create/update/vote commands, native
decision execution, competition-context UI/navigation, cohort rollout, legacy
data migration, and internal legacy-storage retirement. D-05 and D-17 remain at
their accepted later gates and do not block this foundation.
