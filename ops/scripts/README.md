# Scripts

Operational scripts live here. Use this folder for repository-maintenance,
documentation automation, agent workflows, workstream helpers, and other
scripts that support operating the repo rather than building or running the app.

Keep application build, package-management, generated-code, and runtime scripts
under top-level `scripts/` when `package.json`, Next.js, CI, or the `6529`
wrapper expects that location.

## Current Scripts

- `docs-area-remediator-local/`: local validators and remediation helpers for
  `ops/docs`.
- `deploy-staging-artifact.sh`: validates and activates the exact staging
  artifact delivered by the canonical staging workflow.
- `deploy-hub-shadow.cjs`: validates exact frontend PR manifests, partitions
  adjacent target cohorts, and publishes clearly labelled, non-deploying shadow
  status phases for the Deploy Hub pilot.
- `native-surface-evidence.cjs`: executable native-surface evidence
  classifier. It reports whether current Capacitor/Electron coverage is only
  browser simulation or whether package prerequisites are present.
- `testing-strategy.cjs`: frontend testing strategy risk-floor classifier,
  app PR CI planner, changed-file secret scanner, pull-request workflow
  security checker, validation manifest checker, and mutation endpoint registry
  checker.
- `verify-production-artifact.cjs`: validates the closed production artifact
  archive and extracted filesystem shape before deployment.
- `run-docs-area-remediator-loop.sh`: iterative docs remediation loop.
- `process-docs-commit-queue.sh`: docs update queue helper for commit-based
  remediation workflows.
