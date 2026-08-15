# CI Wave Deployment Notifications

The active frontend workflows keep deployment status in the environment CI
waves while production release validation is attached to the corresponding
release-note post.

## Staging

`Web Deploy - STAGING` holds the staging concurrency lock through exact-SHA
build, deployment, and automatic E2E. The CI staging wave receives one
aggregate pipeline result after automatic E2E finishes:

- success when build, deployment, and E2E all succeed;
- failure when any of those stages fails.

Staging does not emit a separate validation-labelled post or reply.

## Production

`Web Deploy - PROD` reports the verified deployment outcome in the CI
production wave. A successful deployment also requests the autonomous release
notes without waiting for automatic E2E.

Automatic production E2E then emits a signed `release_validation` event using
the same exact SHA and release-group identity. The backend appends the passed or
failed result beneath the release-note post; it does not create a separate
validation post in the CI production wave. A later canonical manual E2E run
adds a manual-revalidation reply beneath the same release-note post.

When a deployment has no comparison baseline or no newly merged pull request,
the backend creates a minimal deployment parent so validation still has a
deterministic reply target.

## Rollout Order

Deploy the backend support before merging the frontend workflow change:

1. `releaseNotesGenerationLoop`
2. `api`
3. `releaseBus`

The shared notification script retains its generic alert fields for other
callers, but the active simplified frontend E2E paths do not send `web_e2e`
alerts to the CI waves.
