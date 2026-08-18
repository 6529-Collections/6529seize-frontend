# CI Wave Deploy And WEB E2E Notifications

Frontend deployment and WEB E2E workflows post operational results to the
staging or production CI wave through the existing backend CI alert endpoint.
The backend owns message rendering, profile mentions, deploy-to-E2E
correlation, and drop creation; workflows send identities and outcomes only.

## Message contract

Deployment notifications retain the live headings and environment marker:

```text
[🚧 STAGING] WEB deploy complete ✅
[🚀 PRODUCTION] WEB deploy failed 🚨
```

Each reusable E2E workflow emits its existing `web_e2e` result after the packs
finish. Successful validation remains the compact linked result used by the CI
waves. Failed validation includes its mode, pack, deployed commit, linked run,
and the existing `cc @devs6529` line.

## Correlation flow

1. The canonical deploy workflow posts a `deploy` alert before automatic E2E.
2. The backend stores that deploy drop against the GitHub deployment run ID.
3. Automatic E2E receives that run ID from its caller; manual E2E receives the
   operator-selected canonical deployment run ID.
4. The terminal `web_e2e` alert sends the ID as `parent_deploy_run_id`, allowing
   the backend to reply beneath the matching deploy post.

No active frontend workflow sends release-note validation events. Production
release-note generation remains an independent consequence of a successful
production deployment.

## Workflow ownership

- `deploy-staging.yml` and `build-upload-deploy-prod.yml` post the deploy result
  with `alert_type=deploy` before invoking automatic E2E.
- `staging-e2e.yml` and `production-e2e.yml` post terminal `web_e2e` results for
  both automatic and canonical manual runs.
- Notification steps are best effort and do not change deployment or E2E
  conclusions when the notification transport is unavailable.
- Release Bus train identity is not required for deploy-to-E2E correlation;
  the canonical deployment run ID is sufficient.
