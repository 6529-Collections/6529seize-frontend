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
5. causes `Staging E2E Dispatch` to start `Staging E2E` for the exact successful
   deployment run.

Do not manually dispatch the staging workflow after pushing. A manual dispatch
is a recovery/rerun entry point only and still rejects any ref other than
`1a-staging`.

## Production

The canonical entry point is the manual `Web Deploy - PROD` workflow on
`main` (`.github/workflows/build-upload-deploy-prod.yml`). Production never
deploys because a commit is pushed or a pull request is merged.

Before dispatching, require explicit production authorization, fetch current
`main`, and freeze its exact SHA. The workflow:

1. calls `Build Production Artifact` for that exact main-history SHA;
2. independently verifies the run, artifact ID, API digest, manifest,
   checksums, package bytes, portability record, and current-main ancestry;
3. refuses the run if `main` advanced while it was queued;
4. refuses to deploy if the currently announced production version is not an
   ancestor of the target SHA;
5. deploys the verified artifact; and
6. causes `Production E2E Dispatch` to start `Production E2E` for the exact
   successful deployment run.

Never substitute a branch name for the frozen target SHA or bypass the
independent verifier. Do not manually dispatch production E2E as proof of a
deployment unless this is an explicitly authorized recovery investigation.

## Recovery and closeout

- A failed build or verifier run has no deployment authority. Fix the source or
  retry the exact canonical workflow as explicitly authorized.
- If staging or production deploy succeeds but E2E fails, report the exact
  deploy SHA and the E2E failure separately; do not silently redeploy.
- If production rejects a stale target or downgrade, resolve current `main` and
  the announced production SHA before asking for a new explicit dispatch.
- Report the exact SHA, workflow/run links, deployed version, automatic E2E
  result, and any durable blocker.

See `ops/docs/developer/frontend-deployment.md` for the workflow contract.
