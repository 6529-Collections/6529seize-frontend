---
name: deploy-6529
description: Route and execute 6529 frontend, backend, or coupled staging and production releases through Simple Release Bus v2 by exact PR head SHA, or use the serialized manual fallback only while v2 reports OFF. Use for staging, deploy, promotion, release merge, pause, resume, recovery, or rollout coordination; never submit to Release Bus v1.
---

# Deploy 6529

## Live routing gate

1. Run `./bin/6529 exec node ops/scripts/release-bus-status.mjs` at the start
   and again before any readiness or environment mutation. The helper uses
   authenticated `gh`, prefers v2, and falls back to the disabled v1 endpoint
   only while the additive v2 API is not deployed.
2. Fail closed on an unavailable/malformed API, authentication failure, unknown
   mode, or incomplete controls. Never infer mode from files or old output.
3. Never register with Release Bus v1.
4. Route by the fresh v2 result:

| Mode | Staging | Production |
| --- | --- | --- |
| `OFF` | Serialized manual fallback | Serialized manual fallback with explicit owner authorization and exact staging evidence |
| `STAGING` | Register the exact candidate with v2 | Manual fallback only; production automation is disabled |
| `PRODUCTION` | Register the exact candidate with v2 | Explicitly mark an exact `STAGING_VALIDATED` candidate ready for v2 production |

When mode is active, stop if `ALL` or the target lane is paused. A pause while
mode is `OFF` intentionally disables v2 and does not prohibit the documented
manual fallback.

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
   validation never schedules production automatically.

V2 reuses the exact green PR merge-tree dual-profile artifact when eligible;
otherwise it runs one combined preflight and builds staging and production
profiles concurrently into one checksummed artifact. It owns shared staging
only for deploy plus E2E, reuses the exact qualified artifact for production,
and never publishes release notes.

## Manual fallback while OFF

1. Require `RELEASE_BUS_ENFORCEMENT` to be absent or exactly `false` in every
   repository in the release set.
2. Fetch the exact remote target head and inspect active frontend/backend
   staging, production, and E2E workflows. Wait; never cancel another actor.
3. Re-fetch immediately before pushing. If a shared ref moved, recompute from
   the new head. Never force-push.
4. Deploy required backend units in DAG order before merging/deploying dependent
   frontend work to `1a-staging`.
5. Record exact deployed frontend/backend SHAs before E2E and freeze staging
   until E2E is terminal.
6. Production requires explicit owner authorization and successful validation
   of the intended exact release set. Re-fetch `main`, preserve dependency
   order, and never publish a release note manually.

## Monitoring and recovery

- Use train details, operations, workflow links, manifest identity, failure
  class, and recovery message in `/deploy/ui/bus`.
- Infrastructure and retryable exact deployment failures retry the same
  idempotent operation. They do not isolate candidates.
- A merge conflict marks only the direct candidate `NEEDS_REBASE` and holds
  transitive dependants. Fix the branch and register its new SHA.
- A control-plane defect pauses automation and leaves candidates unblamed. Keep
  exact state, use the OFF/manual fallback only after an operator deliberately
  disables v2, and resume explicitly after repair.
- Failed E2E never creates staging validation. Do not mutate staging while the
  manifest owner still holds the environment lock.
- If production `main` moved, v2 must recompose and requalify; never force the
  recorded composition over a newer ref.

## Closeout

Report exact candidate SHAs/dependencies, train and operation states, deployed
versions, manifest/E2E evidence, failures or holds, and live mode/controls. Do
not expose credentials, signed URLs, raw production data, or hidden prompts.
