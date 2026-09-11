# CI and release acceleration

This workstream treats release latency as a production property. It preserves
the existing exact-SHA, immutable-artifact, read-only-E2E, and fail-closed
evidence contracts while removing serialized work and deployment rebuilds.

The immediate baseline is the 2026-08-04 Network Museum release. Its first
source commit reached production 9 hours, 37 minutes later; the frontend PR
alone took 5 hours, 5 minutes from opening to a successful production deploy.
The release was correct, but its path was not proportionate to the change.

Primary records:

- [Release duration audit](release-duration-audit.md)
- [Target pipeline](target-pipeline.md)
- [Run log](run-log.md)
- [Active context](active-context.md)

## Acceptance targets

These are initial service-level objectives, to be replaced by observed p50 and
p95 values after ten qualifying releases:

| Interval                           | Target, excluding runner queue |
| ---------------------------------- | -----------------------------: |
| PR plan to aggregate App check     | 25 minutes p50; 35 minutes p95 |
| Merge to staging E2E completion    | 30 minutes p50; 40 minutes p95 |
| Merge to usable production         | 40 minutes p50; 50 minutes p95 |
| Merge to production E2E completion | 55 minutes p50; 70 minutes p95 |

No target permits a skipped required check, an unverified source SHA, a mutable
deployment artifact, a production mutation before staging qualification, or a
destructive E2E pack.
