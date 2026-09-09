# CI Wave Deploy And WEB E2E Notifications

Frontend deploy and WEB E2E workflows post results to the staging or production
CI wave through the backend CI alert endpoint. The backend owns message
rendering, profile mentions, reply correlation, and drop creation; workflows
send run identities and outcomes.

## Message Contract

Deploy headings retain the environment and outcome:

```text
[🚧 STAGING] WEB deploy complete ✅
[🚀 PRODUCTION] WEB deploy failed 🚨
```

`WEB` is uppercase. Backend Lambda and desktop build names retain their exact
identifiers. A successful WEB E2E result is one line with no mentions:

```text
[🚧 STAGING] WEB E2E passed ✅ [Run #791 (attempt 2)](https://github.com/owner/repository/actions/runs/791)
```

Attempt 1 omits the suffix. Failed validation includes its mode, optional pack,
deploy commit, run link, and `cc @devs6529`; it also mentions the mapped manual
initiator and original deploy initiator when distinct.

## Correlation And Reruns

1. A successful WEB deploy notification includes its GitHub deployment run ID.
2. The backend creates the deploy drop and stores its drop/part target by
   repository, environment, and run ID.
3. Terminal E2E notifications carry `parent_deploy_run_id`.
4. The backend resolves that identity and supplies the drop API `reply_to`.
   Workflows never persist or transmit a raw drop ID.

Reruns preserve the original deploy identity and show `(attempt N)` for later
attempts. Missing, expired, malformed, or unavailable correlation data produces
a standalone E2E post instead of a guessed reply. Notification jobs use
`always()` and are best effort; transport failure does not change the result.

## Workflow Ownership

- Deploy workflows call `scripts/notify-ci-wave.mjs` with `alert_type=deploy`.
- `deploy-staging.yml` calls `staging-e2e.yml` after deployment;
  `build-upload-deploy-prod.yml` calls `production-e2e.yml`. Each passes its
  deployed commit and parent deployment run ID directly to the reusable
  workflow. E2E completes within the canonical deployment run.
- E2E terminal notifications use `alert_type=web_e2e`, the attempt, resolved
  deployed SHA, validation pack, and parent run ID. They never substitute the
  E2E source SHA for a missing deployed SHA.
- To validate a deployed version again, dispatch the E2E workflow on `main`
  with `automatic_deploy_run_id` naming the original deployment. The workflow
  verifies that its deployment job succeeded and the selected version is still
  live. The staging workflow also accepts a targeted `pack`.

Automatic E2E uses the reusable workflow revision included in the canonical
deployment workflow. Explicit recovery dispatches use the `main` revision;
keep the workflow definitions compatible when changing those inputs.

## Rollout And Recovery

The backend `api` owns this receiver. Deploy it before enabling senders that
need new fields, and coordinate removal of old fields so no in-flight sender
relies on them. Restore compatible sender/receiver versions together during a
rollback. Keep run correlation, autonomous release-note grouping, and the
final publication signal intact; no separate worker deployment is needed for
a sender-only change.

See [Deployment](deployment.md) for the ordinary staging/production process.
