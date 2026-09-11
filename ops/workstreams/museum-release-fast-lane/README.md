# Museum release fast lane

This workstream records the frontend release-performance redesign prompted by
PR #3628, a typography correction that took 1 hour, 44 minutes, and 19 seconds
from work start to completed production E2E.

[proposal.md](proposal.md) retains the original performance investigation and
semantic test-selection design. The recorded shared-authority design in
[one-click-production-architecture.md](one-click-production-architecture.md) is
historical. Its lease, coordinator, and automation-restoration requirements are
superseded by [Deployment](../../docs/developer/deployment.md).

Current deployment uses ordinary merges and GitHub Actions, including automatic
frontend staging deployment and E2E. Artifact integrity, source provenance,
read-only production validation, and useful test selection remain in their
own workflows. Preserve unresolved Museum quality findings and historical
release evidence when following up on this workstream.

Reload `active-context.md`, `run-log.md`, current source, the deployment runbook,
and current GitHub workflow results. Dated logs establish past outcomes rather
than current deployment requirements.
