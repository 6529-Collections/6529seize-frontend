---
name: deploy-6529
description: Operate the frontend's exact-SHA staging and production deployment workflows. Use for frontend staging, production, post-deploy E2E, deployment recovery, or deployment status questions.
---

# Deploy 6529 frontend

This repository owns two direct frontend deployment paths. It does not register
frontend candidates with Release Bus.

## Safety rules

- Resolve every requested branch or pull request to an exact 40-character SHA.
- Fetch immediately before a staging push or production dispatch and stop if
  the selected ref moved.
- Never force-push a deployment branch or cancel another actor's deployment.
- Preserve workflow concurrency and wait for the existing lane when a run is
  queued.
- Treat a successful deploy and its automatic E2E as separate results.
- Do not expose credentials, signed URLs, or raw production data.

## Staging

The canonical entry point is a push to `1a-staging`. That push automatically
runs `Web Deploy - STAGING` (`.github/workflows/deploy-staging.yml`), which:

1. checks out and verifies the pushed SHA;
2. builds and packages those exact bytes;
3. uploads and verifies the immutable artifact;
4. deploys that version to staging; and
5. calls reusable `Staging E2E` for that exact SHA before the canonical workflow
   releases the staging environment lock, then reports the complete pipeline
   outcome to the CI wave.

Do not manually dispatch the staging workflow after pushing. A manual dispatch
is a recovery/rerun entry point only and still rejects any ref other than
`1a-staging`.

Immediately before pushing `1a-staging`, finish all preparation and fetch the
latest shared ref. Then take one fresh bounded staging-drain snapshot across
both repositories: require the effective staging lane to be `OFF` with
`changeable: true`; require the `staging-environment` lock to be unowned with no
active `STAGING` or `PRODUCTION_QUALIFICATION` train or nonterminal operation;
and inspect at most ten pages of 100 queued and in-progress Actions runs per
status and repository. Block on staging deployment, staging-ref advance, or
staging E2E workflows. Production deploy/E2E, PR CI, and unrelated workflows do
not block staging. The status helper alone is not a complete snapshot.

The snapshot is the final read-only sequence before one push and cannot be
reused. If any source is unavailable, ambiguous, over its bound, or reports a
blocker, stop without waiting, polling, cancellation, retry, or mutation and
report the exact source and state. Existing workflow authorization remains the
final race protection.

## Production

The canonical entry point is the manual `Web Deploy - PROD` workflow on
`main` (`.github/workflows/build-upload-deploy-prod.yml`). Production never
deploys because a commit is pushed or a pull request is merged.

Before dispatching, require explicit production authorization, fetch current
`main`, and freeze its exact SHA. The workflow:

1. calls `Build Production Artifact` for that exact main-history SHA;
2. independently verifies the run, artifact ID, API digest, manifest,
   checksums, package bytes, portability record, and current-main ancestry;
3. permits `main` to advance only while the selected SHA remains in its history;
4. refuses to deploy if the currently deployed production version is not an
   ancestor of the target SHA;
5. deploys the verified artifact; and
6. calls reusable `Production E2E` for that exact SHA before the canonical
   workflow releases the production environment lock, then reports the
   complete pipeline outcome to the CI wave.

Never substitute a branch name for the frozen target SHA or bypass the
independent verifier. A manual E2E recovery run must identify a canonical run
whose deployment job succeeded and whose exact version is still live; it cannot
select an arbitrary source SHA or a non-`main` workflow ref.

## Recovery and closeout

- A failed build or verifier run has no deployment authority. Fix the source or
  retry the exact canonical workflow as explicitly authorized.
- If staging or production deploy succeeds but E2E fails, report the exact
  deploy SHA and the E2E failure separately; the final CI-wave notification is
  failure, and operators must not silently redeploy.
- If production rejects a target that left current `main` history or a
  downgrade, resolve current `main` and the deployed production SHA before
  asking for a new explicit dispatch.
- Report the exact SHA, workflow/run links, deployed version, automatic E2E
  result, and any durable blocker.

See `ops/docs/developer/frontend-deployment.md` for the workflow contract.
