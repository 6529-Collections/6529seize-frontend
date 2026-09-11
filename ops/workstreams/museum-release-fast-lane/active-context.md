# Active context

## Current objective

Implement the approved redesign as six separately reviewable PRs, merge each
only after exact-head CI and review, qualify the final train in staging and
production, then publish a technical closeout to the 6529 developer Wave.

Execution began from frontend `main`
`d448d4c282c034fa2a1d5d1d95ce90fc85561e54`. Current authorized deployments
follow `ops/docs/developer/deployment.md`; dated checkpoints below describe
what existed when they were recorded.

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
8. Use direct GitHub Actions deployment with stable-state production health
   polling.
9. Deduplicate Jest selection and dependency/browser setup, and preserve the
   Next.js cache before the build.

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
- direct deployment workflow and runtime health

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
is supplied by the maintainer rather than invented by workflow code. Candidate
dispatch and reusable-call inputs are validated with strict cross-field rules;
reusable calls are forced to truthful control metadata. The controller binds
each request to a fresh nonce and verifies workflow, event, branch, SHA, title,
and run-attempt metadata before observation, cancellation, or evidence.

Queue availability and workload completion are separate budgets. The default
90-second queue budget never cancels an accepted build; the controller derives
a safe repeat-count-aware job timeout from the completion budget and performs a
bounded final reconciliation for delayed runs and transient list failures.
Unverified runs are never cancelled, and incomplete cleanup remains visible in
controller evidence.

The candidate has only read `contents`/`actions` permissions, checks out the
benchmark tool from the trusted workflow SHA separately from the exact source
SHA, activates exact pnpm `10.33.0` before setup-node cache/install, and runs
without deployment credentials. `GH_TOKEN` is scoped to the final API readback
steps and is absent from install/build. It records queue/setup, checkout,
install, build, and package timings plus non-secret environment metadata in
unique JSON/Markdown artifacts. The activation playbook records the current
state: no larger-runner entitlement, no self-hosted capacity, and no runner
variables are provisioned. No GitHub setting or runner has been activated by
this work.

## PR 4 closeout correction

The source trust helper now compares exact-main requests with the declared
trusted main SHA and accepts a distinct source only when the trusted checkout
proves ancestry. Focused tests cover both paths. Generated benchmark evidence
uses UTF-8 em dashes, with no mojibake in the candidate or controller Markdown
documents. The branch is preserved in signed local commits behind the final PR3
tree; it has not changed GitHub, runner capacity, or deployment state.

## PR 4 security boundary correction

- Direct human candidate dispatches can never select a supplied candidate
  label. An Ubuntu authorization job returns `ubuntu-latest` unless the
  dispatch is authenticated as `github-actions[bot]` and the controller/run
  binding is valid; unsupported direct candidate runs fail before source
  checkout.
- Request IDs now include a deterministic digest of every intended input,
  controller run ID, controller attempt 1, repeat number, and nonce.
  Candidate metadata requires actor `github-actions[bot]`, run attempt 1,
  controller identity, controller attempt 1, exact workflow/path/SHA, and the
  same input-bound request ID. Controller reruns fail before dispatch.
- The measured source job has no `GH_TOKEN` and no Actions API permission after
  source execution. It writes only an explicitly untrusted raw observation.
  A fresh Ubuntu verifier checkout independently reads run/controller metadata,
  rebinds the raw fields, and writes the immutable evidence.
- Delayed or undiscovered runs remain `reconciliation_pending`. The controller
  does not clear that state merely because the list endpoint succeeded; cleanup
  must reach terminal state or controller evidence generation fails.

Focused adversarial coverage now passes 18 tests. The signed worktree is ready
for its governed PR after PR3 lands; no runner, repository setting, deployment,
or candidate capacity has been activated.

## PR6 current boundary

PR6 is implemented locally on `codex/museum-release-readiness` and has not been
published or used to mutate any environment. The safe deliverable is deliberately
report-only for portability:

- Elastic Beanstalk readiness uses one adaptive poller with an immediate sample,
  5/10/20/30-second bounded backoff, the existing 1320-second ceiling, and two
  consecutive Green/Ready/exact-VersionLabel observations. Its JSON observation
  record is separate from the exact `/api/version` verifier.
- Environment-bound and legacy artifact producers emit an
  `artifact-portability.v1` inventory. It separates source, content, toolchain,
  package, and runtime-configuration digests and marks current artifacts
  `NOT_PORTABLE` with reuse and promotion authorization disabled.
- A read-only workflow compares staging and production inventories. It downloads
  exact named artifacts, verifies their checksums, and can only produce a blocked
  report; it has no deployment credentials or mutation steps.
- The migration note defines the byte-neutrality gates for moving API, WebSocket,
  allowlist, base URL, chain, asset, announcement, telemetry/Sentry, and
  public-review profile values into signed runtime configuration.

Residual blocker: build-once/promote-twice remains intentionally inactive until
the runtime-neutral package and its same-byte/two-runtime proof exist. The current
frontend package still embeds environment-specific values.

PR6 validation is complete locally: the focused readiness/portability suite is
19/19, the compatibility suite is 16/16, the performance contract is 7/7, the
production artifact contract is 2/2, the staging artifact contract is 3/3,
changed lint and formatting pass, typecheck passes for 1,358 changed TypeScript
files, and `codex-diff-check` is clean. YAML parsing passes for all seven changed
workflows. `actionlint` passes for the new report-only workflow and the production
artifact workflow; the other existing release workflows retain baseline
ShellCheck findings (SC2129/SC2155), and two large workflows exceeded the local
60-second per-file analyzer limit. No live environment was touched.

## PR6 independent-review correction

Five valid findings from the independent review are resolved locally and remain
uncommitted:

- Pre-PR6 `legacy-v2` artifacts without a portability inventory retain their
  immutable deploy path under an explicit `not-portable-pre-pr6-legacy` status.
  Reuse and promotion remain unauthorized. New `environment-bound-v3` artifacts
  still fail if the inventory is missing.
- The Elastic Beanstalk sampler now gives each AWS subprocess a killable timeout
  capped by both 30 seconds and the remaining overall deadline. A healthy response
  received at or after the deadline is recorded but cannot advance readiness.
- Every known runtime key and every additional observed key is classified. The
  producer scans all regular files in the exact extracted package root, retaining
  only digests, counts, and bounded path samples. The scan is exact-literal evidence;
  encoded or transformed values remain an activation blocker.
- Inventory validation now enforces the complete closed v1 shape, exact relevant
  keys, cross-field digest identity, complete runtime-key and package-scan coverage,
  and fail-closed authorization flags.
- The report workflow verifies source repository, trusted workflow path, event,
  successful conclusion, run ID, run head SHA, artifact name, source SHA,
  environment, manifest digest, and contract before comparison.

Corrected local validation: readiness/portability/provenance 19/19; artifact
compatibility 16/16; performance contract 7/7; production artifact 2/2; staging
artifact 3/3; changed lint, Prettier, YAML parsing, typecheck for 1,358 files,
`git diff --check`, and `codex-diff-check` all pass. Targeted `actionlint` passes
for the new report workflow and production artifact workflow. No commit, push,
PR, deployment, or live-environment mutation occurred.

## PR6 artifact-integrity corrections

The independent re-review findings were resolved before the local PR6 commit:

- Legacy Release Bus summaries now preserve the actual staging/production
  environment. `portability_status` is the sole authoritative portability and
  authorization field; the environment label is never replaced by `portable`.
- Report-source verification requires a named GitHub Actions artifact digest
  from the Actions API, binds it to the exact run and artifact name, and
  independently recomputes the downloaded artifact's complete regular-file
  membership and digests rather than trusting `SHA256SUMS` as evidence.
- Each trusted producer/version is bound to its exact artifact contract string;
  coherent forged manifest/inventory contracts fail closed.
- Content roots must be real directories and their canonical real paths must
  remain within the canonical source root before any walk begins.

The complete four-suite readiness, portability, provenance, and Release Bus
contract run passes 46/46. Changed lint, Node syntax, targeted Prettier,
actionlint, and `codex-diff-check` also pass after extracting report-source
validation into its own module and documenting the two canonical-path security
boundaries. The PR6 artifact remains explicitly `NOT_PORTABLE`, report-only,
and without deploy authority.

## 2026-08-06 authoritative train state

This section supersedes earlier implementation-checkpoint statements about
publication status.

- PRs 1-5 are merged. PR #3642 passed its complete exact-head gate and merged
  as `c807f6da8efea7e39405fba8185de153096bf95d`.
- PR #3643 has been reduced to its three PR6-only commits, replayed and signed
  over the PR #3642 squash merge, and retargeted to `main`. Fresh exact-head
  review and CI are required before merge.
- PR 6 local validation passes 105 tests across six focused suites, complete
  Jest and Playwright typechecks, changed typecheck/lint, Knip, debt ratchet,
  actionlint, formatting, and whitespace checks. The 6529 follow-up review
  reports no findings; security, WCAG, and i18n are clean. Advisory workflow
  coverage and Sonar reliability findings are incorporated in the current
  head.
- The separate Storm composer release completed its clean isolated Production
  E2E verification and explicitly released the serialized frontend lane before
  PR #3642 merged.
- No staging or production environment has been mutated by this six-PR train.
  Final staging, E2E, production, E2E, retained qualification, and developer
  Wave closeout remain required.

## 2026-08-06 live qualification correction

- The six-PR train is now merged through PR #3656 at exact main
  `ee156caa5b2a9ed2efaee34659f098e916badcb9`.
- Exact staging deployment and automatic staging E2E passed. Production run
  31113392584 deployed the exact version; live Elastic Beanstalk and HTTP
  readbacks are healthy.
- Final production qualification is blocked by the readiness adapter's
  double-normalization defect, not by the deployed application. The focused
  correction and real-adapter regression are the only active hotfix scope.
- After the hotfix completes its governed release and production E2E, the next
  workstream is the separately reviewed one-click production operation agreed
  with the Dev Team. It must use authoritative pre-dispatch drain/acquisition,
  a bounded cross-repository lane lease and control epoch, an isolated builder
  without deployment credentials, and a fresh artifact verifier before AWS.

## 2026-08-06 readiness hotfix release and one-click design

- PR #3662 merged as exact frontend main
  `86f4d4aa2c3927df1ad0823dc12b1c6b9269f03e` after all exact-head product,
  security, review, signature, and CI gates passed. Production still serves the
  previously deployed `ee156caa5b2a9ed2efaee34659f098e916badcb9`; the hotfix
  has not yet mutated production.
- Exact-tree staging composition
  `87a80d848e68fcb8f73717e3216fae35feab6e28` has the same tree as hotfix main.
  Staging run 31117046350 passed the authoritative guard, then failed before
  checkout or build because GitHub Actions could not download pinned actions
  during the ongoing Actions incident. No environment mutation occurred.
- Once GitHub reports Actions recovered, rerun the complete staging workflow so
  the new attempt executes a fresh guard. Do not use a failed-jobs-only rerun,
  which could otherwise reuse the earlier attempt's authorization result.
- The Dev Team discussion in Wave
  `bf945b75-2912-4ce6-b1f5-95b5b667b7c9` converged on the architecture recorded
  in `one-click-production-architecture.md`: one frozen protected-main commit,
  one authoritative cross-repository production lease, explicit artifact
  identity, isolated build and verification authorities, automatic production
  E2E, and fail-closed run-attempt renewal before AWS mutation.
- Measured recent runs predict approximately 21 / 42 / 58 minutes
  best / median / conservative small-sample p95 when production artifact work
  overlaps staging. A serialized production build predicts 29 / 56 / 72
  minutes. The one-click controller removes manual idle and race windows; the
  25-minute p95 target also requires parallel E2E packs, warm caches or faster
  runners, and path-scoped Museum coverage.
