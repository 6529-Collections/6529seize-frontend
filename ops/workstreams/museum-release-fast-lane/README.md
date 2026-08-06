# Museum release fast lane

This workstream redesigns the frontend release path for the 6529 Network
Museum. Its first case study is PR #3628, a two-line typography correction
that required 1 hour, 44 minutes, and 19 seconds from the start of work to
completed production E2E.

The governing proposal is [proposal.md](proposal.md). It preserves exact-SHA,
immutable-artifact, staging-before-production, read-only-E2E, source-integrity,
and rollback controls. It replaces the binary "Museum changed" test switch
with trusted semantic classification and route/template-specific evidence.

Status: execution authorized. The six-PR rollout is in progress; no release
claim is valid until the run log records exact merged commits, staged and
production runtime readbacks, and terminal E2E evidence.

Reload order: `active-context.md`, `run-log.md`, `proposal.md`, current source,
then live GitHub and Release Bus state.
