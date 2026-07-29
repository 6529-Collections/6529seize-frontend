---
name: deploy-6529
description: Route and execute 6529 frontend, backend, or coupled staging and production releases through an effective Release Bus lane by exact PR head SHA, or use the serialized manual fallback while that target lane reports OFF. Use for staging, deploy, promotion, release merge, turning a lane on or off, recovery, or rollout coordination.
---

# Deploy 6529

## Live routing gate

1. Run `./bin/6529 exec node ops/scripts/release-bus-status.mjs` at the start
   and again before any readiness or environment mutation. The helper uses an
   authenticated `gh` session to read the controls endpoint, verifies hidden
   safety fences, and returns only the two effective automation lanes.
2. Fail closed on an unavailable/malformed API, authentication failure, unknown
   or inconsistent lane state. Never infer ownership from files, raw mode,
   hidden controls, or old output.
3. Route the target environment by the fresh lane result:

| Target lane       | Route                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `STAGING: ON`     | Register the exact candidate with Release Bus                                                                                                          |
| `STAGING: OFF`    | If `changeable: true`, serialized manual staging after the staging drain gate                                                                          |
| `PRODUCTION: ON`  | Explicitly mark an exact `STAGING_VALIDATED` candidate ready for Release Bus production                                                                |
| `PRODUCTION: OFF` | If `changeable: true`, serialized manual production after the production drain gate and explicit owner authorization; staging evidence is not required |

Raw mode and `ALL` are internal emergency fences. They are verified by the
helper but are not normal routing or UI controls. Do not bypass an internal
fence. Both lanes `OFF` means full manual fallback after both drain gates.

There is no inferred control-plane or self-upgrade exception. When a target
lane is `ON`, every deployment for that environment—including API,
`releaseBus`, cleaner/reconciler, and other control-plane changes—must be an
authenticated Release Bus operation. Do not manually dispatch a target
environment workflow while its lane is `ON`. Manual fallback exists only when
the helper authoritatively reports the affected lane `OFF` and its drain gate
passes. The helper must also report `changeable: true` and verify that no hidden
emergency fence blocks fallback. If Release Bus cannot safely self-deploy while
`ON`, stop for explicit owner direction; never infer an exception from the
component or GitHub actor.

## V2 readiness

1. Require an open PR whose exact head and green merge-tree checks are current.
2. Open `/deploy/ui/bus` or call the versioned API. Submit repository, PR,
   branch, exact 40-character head SHA, backend deploy units/DAG edges, and
   candidate dependencies.
3. For coupled work, register backend first and declare it as the frontend
   prerequisite. Declare only real ordering edges; independent backend DAG
   frontier units run concurrently.
4. Report candidate ID, immutable SHA, and status. Do not launch a parallel
   manual deploy after v2 accepts the candidate.
5. Wait for `STAGING_VALIDATED`. `STAGING_DEPLOYED` means manifest-bound E2E is
   still pending and is not production evidence.
6. Production is a separate explicit action. Re-resolve the branch and mark
   ready only when it still equals the exact staging-validated SHA. Staging
   validation never schedules production automatically. A pre-mutation
   production replan may create a new audited replacement from all currently
   eligible explicit selections, including a compatible selection recorded
   after the source train was claimed. Verify every source selection/train
   mapping and omission reason; it must never infer candidates from staging.
   Once any `main` advance succeeds, a production deploy is dispatched, or
   production E2E exists, the original exact set is frozen and may only resume
   or recover unchanged.
   If `PRODUCTION_REPLAN_INTENT_SCAN_FAILED_CLOSED` reaches its bounded cap,
   stop claiming; after ownership drains, revoke/cancel only owner-authorized
   stale intents or deploy a separately reviewed pagination/cap change. Never
   edit the ledger or silently drop intent.

V2 reuses exact green PR merge-tree source and test evidence, then freshly
builds one immutable environment-bound artifact from the train's exact
composition. Staging builds only the staging profile. Production freshly
composes the exact dependency-closed selection on current production `main`
and builds only the production profile; staging artifact bytes are never
reused for ordinary production. Repository-wide lint, typecheck, test
inventory, and full Jest matrices stay in exact-head/merge-tree PR CI rather
than normal train preflight. Shared staging is owned only for deploy plus
manifest-bound E2E. V2 never publishes release notes.

## Manual fallback while the target lane is OFF and changeable

1. Require the helper to report the target lane `OFF` with `changeable: true`
   and no hidden emergency fence blocking fallback. The legacy frontend
   staging and production workflows independently call the authenticated
   readiness gate as their first job and reject before checkout, build, ref,
   credential, or deployment mutation unless the same exact run and drain state
   are authorized. Then prove the target environment lock is free, no target
   mutation/E2E workflow is active, and every already-dispatched exact operation
   is terminal. Fetch the exact remote target head. Wait; never cancel another
   actor.
2. Re-fetch immediately before pushing. If a shared ref moved, recompute from
   the new head. Never force-push.
3. Deploy required backend units in DAG order before merging/deploying dependent
   frontend work to `1a-staging`. Dispatch exactly one backend service workflow
   (`Deploy a service`) at a time and wait for exact success before starting the
   next; shared workflow concurrency can cancel sibling runs, even for
   independent DAG-frontier units.
4. Record exact deployed frontend/backend SHAs before E2E and freeze staging
   until E2E is terminal.
5. With the production lane `OFF`, production requires explicit owner
   authorization but not prior staging deployment or validation. Re-fetch
   `main` and preserve dependency
   order. For backend services, pass the same merged PR number and full
   canonical service set to every sequential production run, setting
   `release_note_publish=true` only on the final service. Never author or post
   the note—the autonomous bot owns it.

## Monitoring and recovery

- Use train details, operations, workflow links, manifest identity, failure
  class, and recovery message in `/deploy/ui/bus`.
- Infrastructure and retryable exact deployment failures retry the same
  idempotent operation. They do not isolate candidates.
- A merge conflict marks only the direct candidate `NEEDS_REBASE` and holds
  transitive dependants. Fix the branch and register its new SHA.
- A control-plane defect leaves candidates unblamed. If the supported,
  authorized recovery procedure turns the affected automation lane off, keep
  exact state and wait for its drain gate before using manual fallback; turn
  the lane on explicitly after repair. If the lane remains `ON`, do not infer a
  self-upgrade exception—stop for explicit owner direction.
- Use the backend fast-off helper only for an emergency hard stop of both
  lanes. Its raw mode and `ALL` changes are intentionally absent from normal UI
  and routing.
- Failed E2E never creates staging validation. Do not mutate staging while the
  manifest owner still holds the environment lock.
- If either production `main` base moves before irreversible mutation, v2 must
  preserve every explicit intent and replan a fresh audited, dependency-closed
  replacement. After irreversible mutation, freeze the original exact set and
  require exact recovery. Never force a recorded composition over a newer ref
  or broaden an active train in place.

## Closeout

Report exact candidate SHAs/dependencies, train and operation states, deployed
versions, manifest/E2E evidence, failures or holds, and both effective lane
states. Do
not expose credentials, signed URLs, raw production data, or hidden prompts.
