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
