# Active context

## Current objective

Implement the approved redesign as six separately reviewable PRs, merge each
only after exact-head CI and review, qualify the final train in staging and
production, then publish a technical closeout to the 6529 developer Wave.

Execution began from frontend `main`
`d448d4c282c034fa2a1d5d1d95ce90fc85561e54`. Release Bus state must be read
fresh before every environment mutation; this file is not release authority.

## Current finding

PR #3628 changed two `className` values in
`components/museum/MuseumNetworkProposition.tsx` and adjusted one focused Jest
test. The current binary Museum classifier selected two broad browser packs.
The first pack ran 69 local browser tests in 40.9 minutes and did not visit the
changed `/museum/network/about` route.

That 40.9-minute result included two serial-group replays after an actionable
React missing-key warning on an unrelated Casey route. The warning should be
fixed. The suite topology should prevent one content instance from replaying
the complete Museum corpus while retaining retries and console diagnostics.

Staging and production repeated broad Museum coverage. The staging
institutional-practice pack ran 70 tests in 10.2 minutes; production ran the
same 70 tests in 8.1 minutes. The changed About route still had no dedicated
hosted browser contract.

Every staging build also generated 31,716 static pages. In the #3628 staging
run, compilation took 2.8 minutes, TypeScript took 1.8 minutes, and static page
generation took 5.0 minutes. The complete staging build-and-package step took
10 minutes, 52 seconds despite a warm Next.js cache.

## Recommended direction

1. Add a trusted, fail-closed semantic classifier and a Museum surface
   registry.
2. Move exhaustive content-instance assertions to fast static contracts.
3. Run browser evidence for affected routes and distinct rendering templates.
4. Keep full-instance browser sweeps nightly and for systemic changes, with a
   release hold if the scheduled baseline is red.
5. Provision and benchmark an ephemeral high-CPU build runner using the runner
   variables already present in the workflows.
6. Reduce the 31,716-page build cardinality and remove duplicate exact-tree
   typechecking from release builds.
7. Move toward one runtime-configured immutable artifact promoted through
   staging and production.
8. Restore Release Bus v2 as the sole automated mutation authority and replace
   fixed production health sleeps with stable-state polling.
9. Deduplicate Jest selection and dependency/browser setup, and preserve the
   restored Release Bus Next cache instead of deleting it before the build.

## Target

After the complete redesign, a mechanically small, leaf-route presentation
change should be production-qualified in 25 minutes at p95, measured from
ready PR to successful production E2E. The interim target with the current
build architecture is 40 minutes at p95.

## Active parallel audits

- Museum surface registry and test topology
- runner and cache benchmark design
- static-generation cardinality and build duplication
- runtime-neutral artifact boundary and readiness polling
- live Release Bus procedure and control-plane health

All delegated lanes are read-only. The owning orchestrator reviews and lands
every diff.

## PR 2 implementation checkpoint — Museum surface registry and corpus contracts

PR 2 is implemented on the `codex/museum-release-surfaces` worktree as a
report-only, runtime-neutral change. No push, pull request, merge, staging
deployment, or production deployment has been performed.

- Added the versioned Museum surface registry and JSON Schema. After reconciling
  the concurrently merged data-architecture reading room, it owns all 32 Museum
  page routes, 4 support files, 32 Museum components, and 5 Museum E2E
  specs across 17 stable surfaces, including shell, proposition, collection,
  accession, artist, project, system, gift, object, program, rights,
  institutional index/profile, research source-table, governance, and
  methodology.
- Added the TypeScript-compiler-API registry checker. It validates the schema,
  inventory, and ownership; builds the reverse import graph; escalates shared
  dependencies to every affected surface; and fails closed on unmapped Museum
  paths or unresolved local imports. The current graph smoke has 73 registered
  entries, 183 visited modules, and 0 unresolved local imports.
- Added seeded unit coverage for complete inventory, unmapped page/component/
  spec failures, shared-dependency escalation, direct mapping, and unresolved
  imports.
- Added static publication corpus contracts for institutional profiles,
  required sections and source paths, HTTPS credential-free research sources,
  route/source coherence, Casey Reas and Keys & Gates inventories and
  relations, and atomic exact-source activation. The test fixture now contains
  the semantic sections and HTTPS research links required to make those
  contracts substantive.
- Added a focused read-only About browser contract for desktop and mobile
  typography floors, line-height and color hierarchy, overflow, safe links,
  exact source identity, and console/network diagnostics. The broad
  institutional-practice sweep remains registered for manual and deployed
  qualification; it is not added to the PR lane in this report-only phase.
- Added the About E2E pack and generated manifest/README entries. The manifest
  now records 71 packs overall, 15 Museum packs, 17 staging post-deploy packs,
  and 16 production post-deploy packs; the release-bus performance contract is
  synchronized to the latter two counts.
- Added the registry and corpus files, scripts, focused tests, and About spec
  to the policy bundle while preserving its 96-file cap. The App PR quality
  lane invokes registry/corpus validation in shadow mode and reports failures
  without reducing existing checks. The existing Museum browser lane adds only
  the new focused About contract.

### PR 2 validation

- `seize run museum:surface-registry`: passed; 17 surfaces, 32 routes, 4
  support files, 32 components, 5 E2E specs.
- `seize run lint:changed`: passed.
- `seize run typecheck:changed`: passed for 1,358 changed TypeScript files.
- `seize run typecheck:tests`: passed; Jest ratchet reported 2,125 existing
  diagnostics across 872 files, and Playwright typecheck passed.
- `seize run e2e-manifest:check`: passed; package and generated README are in
  sync.
- `seize run lint:package-json`: passed.
- Focused regression run: 11 suites, 290 tests passed.
- `codex-diff-check`: passed.
- The Windows policy-bundle Jest suite cannot exercise its assertions because
  this platform does not expose Node `fs.constants.O_NOFOLLOW`; it exits at
  the fail-closed platform guard. Hosted Linux CI remains authoritative for
  the bundle's protected-path tests. No workaround was added that would
  weaken the protection.
- No local build or browser execution was attempted. The worktree's node
  modules junction supports the requested Jest, lint, and typecheck commands
  but not Turbopack; hosted CI owns build and browser execution.
