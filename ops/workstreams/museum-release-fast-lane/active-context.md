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

## PR 3 implementation checkpoint - conservative tier activation

PR 3 is implemented in the `codex/museum-release-tier-activation` worktree.
It does not push, open a pull request, merge, deploy, or mutate a staging or
production environment.

- Added the protected `museum-release-selection-v1` decision record. It binds
  an exact base/head range to the existing trusted classifier and records the
  tier, selected packs, static scope, activation mode, Museum-hold state,
  optional resolved canonical source SHA, and a digest. Any classifier, range,
  inventory, mode, hold-state, or supplied source-SHA problem selects every
  Museum pack or fails the workflow before qualification.
- P0 is the only narrowed path: the exact About proposition pack runs on
  desktop and 390px mobile, while the static source/shell corpus sentinel still
  runs first. Hosted P0 checks bind their rendered source link and displayed
  commit to the exact SHA in the selection evidence. The P0 AST proof now also
  permits only a strengthened static assertion program in its focused test;
  render/setup and interactions remain disallowed.
- P1 remains a conservative all-pack result because the registry does not yet
  contain a trusted template-to-pack mapping. P2 and P3 also select every
  Museum pack. This preserves the proposal's broad fallback instead of
  guessing a template relation.
- `MUSEUM_RELEASE_TIER_MODE=full` is the immediate rollback switch. A missing
  or malformed value is also full. An active or unreadable
  `release-bus-museum-hold` GitHub issue likewise restores every pack in App
  PR, staging, and production qualification.
- The old broad institutional-practice pack is retained for nightly (`cron`),
  manual, and post-deploy execution. The scheduled or explicitly authorized
  manual broad sweep records an auditable Release Bus Museum hold on failure;
  only a passing authorized exact-source adapter plus broad sweep can close the
  bot-managed hold.
- Added a reusable frontend-side bilateral compatibility workflow. It resolves
  canonical Museum `main` once to an exact SHA, rejects any caller SHA that is
  not that exact SHA, checks out current frontend `main`, and runs the strict
  adapter only against immutable GitHub raw endpoints. It stores the adapter
  result as an artifact and exposes a `workflow_call` interface for the source
  repository's protected-main workflow. The source-repository caller remains a
  configuration/merge step outside this PR3 worktree.
- Added comprehensive synthetic selector/adapter coverage and an exact
  historical shadow-evidence ledger. The ledger records code ranges only; it
  makes no fabricated 20-release or production-performance claim.
- App PR planning now reuses the classifier's Museum/policy predicates, so P1
  presentation paths and P3 workflow/control-plane changes cannot omit the
  broad Museum browser lane. The AST parser is lazy-loaded to keep that
  predicate reuse valid before dependencies are installed.
- App PR executes tier tooling staged from protected base `main`; because this
  bootstrap PR predates the selector on that base, it intentionally emits a
  full-pack decision until the merged selector becomes trusted. The adapter
  workflow records a negative JSON result even when its runner cannot launch.
- The plan job independently evaluates changed paths with the protected-base
  Museum/policy predicates before building its matrix; a classification or Git
  failure forces the broad Museum lane, so candidate policy code cannot omit
  its own P3 qualification.

### PR 3 integration status

PR 3 is rebased onto exact frontend main
`a55c83c2ad29db7c66ef55c26f45ec645a71db35`. That main includes PR 2 at
`fe0ad4ade31f84d6321f200bf8a0ec531e7651bb` and the subsequent Data
Architecture diagnostic stabilization. Current main contains five Museum
packs in each local/staging/production inventory, so full-mode selection now
includes Data Architecture alongside Institutional Practice, About, Inside the
System, and Rights. P0 remains the single About pack.

The current-main rebase includes PR #3640's emergency restoration of the full
five-pack browser command. PR 3 preserves its one-process, one-worker execution
and all five packs in conservative/full mode, while replacing the temporary
hard-coded inventory with the validated selector array needed for the P0 path.

Hosted run `31066104003` exposed and failed closed on a bootstrap path error:
the immutable protected classifier was staged outside the checkout and could
not resolve the Git tree. Its immutable copy is now staged immediately below
the workspace root, with a regression contract. Fresh exact-head CI remains
required before merge.

The final trust review also found that a candidate could recompute the digest
after changing its selected pack inventory. Trusted Release Bus preflight now
recomputes the entire expected selection from the exact candidate tree using
immutable selector code, current hold state, and the independently resolved
canonical Museum source. Forged selection semantics fail even when every
candidate-controlled checksum is internally consistent.

Canonical Museum `main` resolved to
`6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73`. The strict adapter accepted that
immutable source exactly, returned `adapter_status=current`, and bound the
publication commit to the same SHA. The earlier stale-adapter result remains in
the run log as historical evidence; it is superseded for this integrated tree.

## PR 4 checkpoint — runner benchmark boundary

The dispatch-only runner benchmark is implemented on the PR4 branch. It has a
trusted `main`-only controller, exact main-ancestor source validation, an
explicit `ubuntu-latest` control profile, and a candidate profile whose label
is supplied by the maintainer rather than invented by workflow code. The
controller polls only its request-correlated candidate runs and cancels only a
run that it dispatched when the configured timeout expires; an absent or
timed-out label is recorded as `unavailable`.

The candidate has only read `contents`/`actions` permissions, checks out the
benchmark tool from the trusted workflow SHA separately from the exact source
SHA, and runs without deployment credentials. It records queue/setup,
checkout, install, build, and package timings plus non-secret environment
metadata in unique JSON/Markdown artifacts. The activation playbook records
the current state: no larger-runner entitlement, no self-hosted capacity, and
no runner variables are provisioned. No GitHub setting or runner has been
activated by this work.

## PR 4 closeout correction

The source trust helper now compares exact-main requests with the declared
trusted main SHA and accepts a distinct source only when the trusted checkout
proves ancestry. Focused tests cover both paths. Generated benchmark evidence
uses UTF-8 em dashes, with no mojibake in the candidate or controller Markdown
documents. The branch remains intentionally uncommitted and has not changed
GitHub, runner capacity, or deployment state.
