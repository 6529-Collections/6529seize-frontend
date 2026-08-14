# CI Wave Deploy And WEB E2E Notifications

Frontend deploy and WEB E2E workflows post operational results to the staging
or production CI wave through the backend CI alert endpoint. The backend owns
message rendering, profile mentions, deploy-to-E2E correlation, and actual drop
creation; workflows send identities and outcomes only.

## Message Contract

Deploy headings retain a dedicated environment marker and end with the outcome:

```text
[🚧 STAGING] WEB deploy complete ✅
[🚀 PRODUCTION] WEB deploy failed 🚨
```

`WEB` is uppercase. Backend Lambda names and desktop build names must remain
exact identifiers; do not split camelCase names into prose.

A successful WEB E2E validation is intentionally one line and mentions nobody:

```text
[🚧 STAGING] WEB E2E passed ✅ [Run #791 (attempt 2)](https://github.com/owner/repository/actions/runs/791)
```

The attempt suffix is omitted for attempt 1. A failed validation includes its
validation mode, optional pack, deploy commit, linked run, and a separate
`cc @devs6529` line. It also mentions the mapped manual validation initiator and
the original deploy initiator when they are distinct.

## Correlation Flow

1. A successful WEB deploy notification includes its GitHub run ID and, for a
   Release Bus deploy, its release train ID.
2. The backend creates the deploy drop and stores its drop/part target against
   those identities.
3. The terminal E2E notification includes `parent_deploy_run_id`,
   `parent_release_train_id`, or both.
4. The backend resolves the identities and supplies the drop API `reply_to`
   value. Workflows never persist or transmit a raw drop ID.

When both parent identities are supplied, both must resolve to the same deploy
drop. Missing, expired, mismatched, ambiguous, or unavailable correlation data
produces a standalone E2E post instead of risking a reply to the wrong deploy.

## Automatic, Manual, And Rerun Behavior

| E2E invocation                                | Correlation identity                  | Posting behavior                                          |
| --------------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Automatic after a normal deploy               | `automatic_deploy_run_id`             | Reply to that deploy drop                                 |
| Release Bus validation                        | `release_train_id`                    | Reply to that train's deploy drop                         |
| Rerun of either workflow                      | Preserved original workflow inputs    | Reply to the same deploy; show `(attempt N)` when `N > 1` |
| New manual dispatch with a parent identity    | Operator-supplied deploy run or train | Reply when the identity resolves safely                   |
| New manual dispatch without a parent identity | None                                  | Standalone post                                           |

Notification jobs use `always()` and are best effort. A notification transport
failure must not change the deploy or E2E result.

## Workflow Ownership

- Deploy workflows call `scripts/notify-ci-wave.mjs` with `alert_type=deploy`.
- `staging-e2e.yml` and `production-e2e.yml` have terminal notification jobs
  that call the same script with `alert_type=web_e2e`, the run attempt, resolved
  deployed SHA when available, validation pack, and available parent
  identities. The notifier never substitutes the E2E workflow SHA for a missing
  deploy SHA; backend correlation retains the original deploy SHA.
- `staging-e2e-dispatch.yml` and `production-e2e-dispatch.yml` carry the
  completed deploy run ID into the E2E workflow.
- Release Bus workflows carry the release train ID through deployment and E2E.

The automatic post-deploy dispatchers invoke the E2E workflow from the default
branch (`main`). Consequently, merging only to `1a-staging` does not activate a
new E2E notification implementation. Before the change reaches `main`, an
operator can test it only by explicitly dispatching the feature-branch E2E
workflow with the intended parent deploy identity.

## Rollout

Deploy the backend `api` receiver before merging the frontend workflow changes.
The older receiver does not accept the new WEB E2E fields. Rollback the
frontend workflow sender first, then the backend receiver, so no active sender
targets an older contract.
