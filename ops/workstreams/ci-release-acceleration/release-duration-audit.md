# Network Museum release duration audit

This is a dated performance audit. Its past workflow names, bus lineage, and
fallback observations describe the measured releases; current deployments use
[Deployment](../../docs/developer/deployment.md).


## Audit boundary

This is a minute-resolution reconstruction of the 2026-08-04 release that
placed frontend commit `11c91ab0576dd69ee3bc4dec671702dbc0d0bf69` in
production. All times are UTC. GitHub timestamps and job-step durations are
exact where available. Authoring and triage intervals without machine events
are labelled as observed gaps; they are not assumed to be idle.

- First source commit: approximately 11:15
- Production deployment complete: 20:52:44
- End-to-end elapsed time: 9 hours, 37 minutes, 28 seconds
- Frontend PR #3588 opened: 15:47:24
- PR-open to production: 5 hours, 5 minutes, 20 seconds
- Production runtime: `11c91ab0576dd69ee3bc4dec671702dbc0d0bf69`

## Timeline

| Time              |                         Elapsed | Event                                                                             | Classification              | Consequence                                                                                                                                                              |
| ----------------- | ------------------------------: | --------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 11:15–11:45       |                            ~31m | Museum source authoring before PR #23                                             | Active work                 | Necessary scholarship and records work.                                                                                                                                  |
| 11:45:47–13:37:53 |                        1h52m06s | Source PR #23 review, expansion and three-platform validation                     | Active review + CI          | First complete source package merged.                                                                                                                                    |
| 13:01–15:47       |                     overlapping | Frontend implementation and local qualification began while source work continued | Active work                 | Useful parallelism; this was not on the source critical path.                                                                                                            |
| 13:37:53–14:21:23 |                          43m30s | Interval before source PR #24                                                     | Unobserved authoring/review | Copy corrections were not consolidated into PR #23.                                                                                                                      |
| 14:21:23–14:42:20 |                          20m57s | Source PR #24 review and full validation                                          | Rework + CI                 | Second complete source validation.                                                                                                                                       |
| 14:42:20–15:04:10 |                          21m50s | Interval before source PR #25                                                     | Unobserved authoring        | Final terminology correction prepared separately.                                                                                                                        |
| 15:04:10–15:12:19 |                           8m09s | Source PR #25 review and validation                                               | Rework + CI                 | Third source PR merged.                                                                                                                                                  |
| 15:12:27–15:19:35 |                           7m08s | Canonical source main validation, run 30922946613                                 | Required CI                 | Exact 247-entry release confirmed.                                                                                                                                       |
| 15:19:35–15:47:24 |                          27m49s | Frontend packaging and PR preparation                                             | Active work                 | PR #3588 opened.                                                                                                                                                         |
| 15:47:24–16:05    |                            ~18m | Initial frontend CI                                                               | Infrastructure stall        | Full-history checkout transferred blobs from unrelated refs; App checkout consumed 1,001 seconds and secret-scan checkout 350 seconds before scanning.                   |
| 16:04–16:07       |                             ~3m | `blob:none` checkout repair                                                       | Active rework               | Checkout defect corrected.                                                                                                                                               |
| 16:07–16:27       |                            ~20m | Directory removal/restoration and intermediate build                              | Product rework + wasted CI  | Knip exposed an unreachable public directory after a 554-second build had already run.                                                                                   |
| 16:27–17:12       |                            ~45m | App CI run 30929199133                                                            | Serialized validation       | Production build took 783 seconds; Museum browser pack took 1,213 seconds in the same job.                                                                               |
| 17:14–17:38       |                            ~24m | App CI run 30933048291                                                            | Failed validation           | Build and shell packs passed; moving-ref Museum source verification failed closed.                                                                                       |
| 17:38–17:55       |                            ~17m | Exact-source repair                                                               | Active rework               | Browser gate changed from moving source to one immutable Museum commit.                                                                                                  |
| 17:55:33–18:40:42 |                          45m09s | Final App CI run 30936175555                                                      | Critical path               | Build, smoke, critical shell and Museum browser suites ran serially.                                                                                                     |
| 18:40:42–18:41:48 |                           1m06s | Merge completion                                                                  | Required coordination       | PR #3588 merged as `aa77ddf8…`.                                                                                                                                          |
| 18:57:21–19:13:23 |                          16m02s | First staging deploy, run 30941026460                                             | Deployment                  | Staging build/package alone consumed 650 seconds.                                                                                                                        |
| 19:13:25–19:25:16 |                          11m51s | First staging E2E, run 30942280799                                                | Failed validation           | Product was healthy; two stale mobile Waves assertions failed.                                                                                                           |
| 19:25:16–19:28:47 |                           3m31s | Failure classification and repair preparation                                     | Active triage               | Test contract corrected.                                                                                                                                                 |
| 19:28:47–19:52:41 |                          23m54s | Hotfix PR #3591                                                                   | Test rework + CI            | Public Review Snapshot Trust alone consumed 16m24s.                                                                                                                      |
| 19:54:04–20:07:21 |                          13m17s | Second staging deploy, run 30945380394                                            | Deployment                  | Exact main `11c91ab0…` reached staging.                                                                                                                                  |
| 20:07:25–20:25:59 |                          18m34s | Second staging E2E, run 30946407128                                               | Infrastructure stall        | Immutable-tooling Git fetch stalled for 1,069 seconds; the runner stopped before any pack executed.                                                                      |
| 20:26:54–20:27:27 |                             33s | First production dispatch, run 30947897778                                        | Control-plane wait          | Readiness returned HTTP 409 because cancellation state had not propagated.                                                                                               |
| 20:27:27–20:30:32 |                           3m05s | Readiness propagation and retry                                                   | Waiting                     | No product work occurred.                                                                                                                                                |
| 20:30:32–20:52:44 |                          22m12s | Production deploy, run 30948172792                                                | Critical path               | Fresh production build and activation succeeded.                                                                                                                         |
| after 20:52       | 7.6m Museum; broader run longer | Retained production qualification                                                 | Required manual evidence    | Museum 70/70, core 16/16, surface 28/28 applicable, WCAG/i18n 6/6. Broad aggregate was 107/108 because the Meme Calendar test still named the replaced timezone buttons. |

## Where the production deploy spent its time

| Step                               | Duration |
| ---------------------------------- | -------: |
| Checkout                           |      10s |
| Dependency install                 |      26s |
| Build App                          |   15m28s |
| Build Target                       |      46s |
| Elastic Beanstalk health/readiness |    4m05s |
| HTTP version verification          |      20s |

The 15m28s build began only after staging had finished. Building the exact
production artifact on `main` while staging is qualified removes that build
from the production deployment critical path.

## Why final PR CI took 45 minutes

Run 30936175555 placed independent checks in one job:

| Work                        | Duration | Dependency on previous work              |
| --------------------------- | -------: | ---------------------------------------- |
| Dependency install          |      27s | Setup only                               |
| Knip                        |      13s | None after install                       |
| Release contract            |      12s | None after install                       |
| Changed lint                |      35s | None after install                       |
| Test typecheck              |    1m21s | None after install                       |
| Related Jest                |      33s | None after install                       |
| Production build            |   13m11s | None of the browser packs                |
| Smoke browser pack          |    1m59s | None of the build/other browser packs    |
| Critical-shell browser pack |    2m57s | None of the build/other browser packs    |
| Museum browser pack         |   21m24s | Needed only for Museum-impacting changes |

The theoretical floor was the longest lane, about 21½ minutes plus setup, not
the 45-minute sum. Matrix execution makes that dependency structure explicit.

## Root causes

| Cause                                                   |                                                                               Measured cost | Disposition                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------- |
| Three source correction PRs after the main expansion    |                          Four source-main validations; 25m52s runner wall, plus review gaps | Editorial freeze before source merge; amendments remain possible but are not the default release rhythm.       |
| Full-history blob transfer                              |                                           1,001s App checkout and 350s secret-scan checkout | Complete history with `filter: blob:none`; bounded sparse checkouts for immutable tooling.                     |
| Late public-route reachability finding                  |                                                      ~20m rework and a 554s cancelled build | Knip and route contracts run in the short quality lane before long lanes finish.                               |
| Moving Museum source lookup                             |                                                        One ~24m failed run plus ~17m repair | Resolve one exact source commit before starting the Museum server.                                             |
| Serial App CI                                           |                                                                            45m09s final run | Independent matrix lanes with one aggregate branch-protection result.                                          |
| Repeated frontend builds                                | 73.5 minutes of observed build-step time across superseded, staging and production attempts | Cache secret-free build intermediates; prebuild immutable production bytes on main; deploy without rebuilding. |
| Staging tooling fetch                                   |                                                                          17m49s, zero tests | Two-minute sparse immutable-tooling checkout; no ad-hoc SHA fetch in the E2E job.                              |
| Stale assertions                                        |                                                       11m51s staging failure plus hotfix PR | Corrected Meme Calendar and Waves contracts; E2E remains product-facing, not selector-blind.                   |
| Missing automatic production E2E in the OFF/manual lane |                                                     No sanctioned hosted production E2E run | Success-only dispatcher plus exact deploy-run readback and null release-binding evidence for manual fallback.  |

## Runner and cache findings

As of this audit, the organization API reports that GitHub-hosted larger runners
are not available for this organization; the current token also lacks the
organization-admin scope required to enumerate self-hosted runners. No workflow
was pointed at an unprovisioned label.

The pipeline instead exposes runner-label variables while defaulting safely to
`ubuntu-latest`: `CI_LINUX_RUNNER`, `CI_BUILD_RUNNER`,
`STAGING_BUILD_RUNNER`, `PRODUCTION_BUILD_RUNNER`,
`RELEASE_BUILD_RUNNER`, and `E2E_RUNNER`. A larger builder can be introduced
without another code change after provisioning and measurement.

Caches are performance aids only:

- pnpm store: lockfile- and Node-major-bound;
- Playwright Chromium: lockfile-bound, with system dependencies still installed;
- Next.js: profile-namespaced for secret-free PR, staging and Release Bus builds;
- production secret-bearing build intermediates are not exposed through a
  default-branch cache; production speed comes from an immutable artifact.

No cache satisfies source identity, install integrity, build evidence,
artifact checksums, or deployed-version checks.

## Open-PR review

| PR or lineage                    | Decision                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #3582                            | Ported the valid matrix, artifact staging, success-only dispatch, pack exclusion and cache concepts onto current main; did not merge its stale 120-file branch state wholesale.         |
| #3586                            | Kept outside this release. It introduces a second mutation/composition plane and broader write permissions; Deploy Hub remains a staged shadow/CAS program.                             |
| #3190                            | Superseded by the current CJS pack manifest.                                                                                                                                            |
| #3191                            | Daily production canary remains useful but is orthogonal to release latency; the new automatic post-deploy E2E closes the release gap first.                                            |
| #3192 and #3193                  | Selector and route-manifest ratchets remain useful follow-ups after rebase; neither belongs in the deployment critical-path rewrite.                                                    |
| Release Bus v2/v3 merged lineage | Preserved as canonical. Environment-bound v3 artifacts remain the normal target; legacy dual-profile behavior remains a compatibility path until the control plane changes its default. |

## Qualification caveat from the audited release

The deployed Museum product was qualified through retained exact-SHA read-only
packs, but the second hosted staging E2E run was cancelled before tests and the
manual production lane created no hosted Production E2E run. This audit does
not relabel those facts. The new pipeline adds the missing automatic production
run and removes the staging tooling-fetch failure mode.

## Implemented steady-state evidence

The first complete accelerated release reached production from merge in 27m38s
and completed automatic production qualification in 38m46s. The exact observed
steps were:

| Stage               | Run         |                                             Observed result |
| ------------------- | ----------- | ----------------------------------------------------------: |
| Final PR App CI     | 30963778437 |                         10m34s longest lane; Museum omitted |
| Staging deploy      | 30964484960 | 12m53s, including 10m47s artifact build and 1m44s promotion |
| Production prebuild | 30964439072 |                             13m33s, concurrent with staging |
| Staging E2E         | 30965170461 |                       6m55s dispatch-to-finish; 12/12 packs |
| Production deploy   | 30965594547 |                                     5m16s, down from 22m12s |
| Production E2E      | 30965872983 |                                         10m54s; 12/12 packs |

Production promotion is therefore about 76% faster than the audited 22m12s
deployment. The final PR gate is about 77% faster than the audited 45m09s gate.
The first live release met the 40-minute merge-to-production and 55-minute
merge-to-qualified-production targets.

That run also found one remaining selection defect: production E2E spent 8m14s
inside the Museum institutional-practice pack even though the deployed change
set contained no Museum-owned path. The production selector now compares the
new exact tree with the most recent prior successful production deployment and
uses the same centralized Museum path classifier as PR and staging. It fails
closed: missing history, an invalid range, a Git failure, or an older runner
without pack exclusion retains Museum coverage.

## Qualification feedback: retry the failed pack, not the release

The first full staging qualification of main `5b03302719b306b29582d43f6910fd1a843de1f7`
exposed a second-order effect of pack parallelism. Run 30972152707 attempt 1
executed fourteen packs with three workers. Thirteen packs passed, including
both Museum packs. The collections pack received persistent `6529 Error` and
`404 | PAGE NOT FOUND` documents from several NextGen routes. An immediate
isolated replay against the same deployment passed 20/20 in 77 seconds.

Attempt 2 again passed thirteen packs, including collections and both Museum
packs, but the social pack received a persistent `6529 Error` document for the
public profile route. Its immediate isolated replay passed 12/12 in 36 seconds.
The failure moved between unrelated packs while each failed pack passed in
isolation. That evidence is consistent with transient staging service pressure,
not a source regression. The gate correctly blocked production in both cases,
but rerunning all fourteen packs repeated more than thirteen minutes of work.

The pack runner now retains the three-worker first pass and supports one
capability-negotiated serial retry of failed packs. Every attempt has a separate
artifact path and structured evidence entry. A pack is green only if its final
attempt passes; a persistent second failure remains release-blocking. This
keeps the broad quality gate while replacing an all-pack workflow rerun with a
bounded retry of only the work that failed.

The first green run of that retry contract, staging run 30976430422, exposed a
separate selection defect before production: `museum-institutional-practice`
was omitted, but the newer `museum-inside-system` pack still ran because the
workflow excluded one literal alias. The manifest now owns the `museum` change
scope for every dedicated Museum pack. Automatic PR and deployed-environment
selection derive from that scope, with a validator requiring every pack made
entirely of `tests/museum/` specs to declare it. A legacy `museum-*` alias
fallback keeps rollback sources compatible. Future Museum packs therefore
cannot silently enter unrelated release qualification.

## Final corrected release qualification

PR #3604 merged as exact main
`2edfb2610c0cca9f49d45c5465c43bba8a20077e` at 05:58:51 UTC. The final
release completed production qualification at 06:29:38 UTC.

| Stage                     |         Run | UTC interval      | Duration | Result                                     |
| ------------------------- | ----------: | ----------------- | -------: | ------------------------------------------ |
| Final PR App CI           | 30979078634 | 05:45:13-05:57:36 |   12m23s | All lanes green; Museum omitted            |
| Quality and contracts     | 30979078634 | 05:45:55-05:48:51 |    2m56s | Linux policy suite and related tests green |
| Playwright smoke          | 30979078634 | 05:46:01-05:49:34 |    3m33s | Green                                      |
| Playwright critical shell | 30979078634 | 05:46:01-05:50:40 |    4m39s | Green                                      |
| PR production build       | 30979078634 | 05:46:00-05:57:23 |   11m23s | Green; longest PR lane                     |
| Staging deploy            | 30979848612 | 05:59:42-06:12:41 |   12m59s | Exact composition `12b40bd96...` live      |
| Production prebuild       | 30979804039 | 05:58:53-06:13:40 |   14m47s | Ran concurrently with staging              |
| Staging E2E               | 30980599423 | 06:12:50-06:19:39 |    6m49s | 12 packs; zero Museum; zero final failures |
| Production promotion      | 30981038834 | 06:20:40-06:26:38 |    5m58s | Prebuilt bytes promoted; no rebuild        |
| Production E2E            | 30981386269 | 06:26:45-06:29:38 |    2m53s | 11 packs; zero Museum; zero failures       |

The corrected pipeline reached production 27m47s after merge and completed
automatic production qualification at 30m47s. The original audited production
deployment took 22m12s by itself; exact-artifact promotion now takes 5m58s, a
73% reduction. The original final PR gate took 45m09s; corrected PR App CI took
12m23s, also a 73% reduction. More importantly for iteration speed, quality,
smoke, and critical-shell feedback all completed within 4m39s instead of
waiting behind the production build.

The Museum-selection contract passed in every layer:

- PR CI did not create a Museum lane for the release-infrastructure diff.
- Staging evidence contained 12 non-Museum packs and no Museum script key.
- Production evidence contained 11 non-Museum packs and no Museum script key.
- The staging collection pack failed its first attempt and passed the one
  permitted serial retry in 55.7 seconds; the other eleven packs were not
  repeated.
- Production completed all eleven packs on their first attempt in 82.6 seconds
  of pack-execution wall time.

The release therefore proves all four intended properties together: short
independent PR feedback, Museum tests only for Museum-impacting changes,
bounded failed-pack retry, and exact prebuilt production promotion followed by
automatic read-only production qualification.
