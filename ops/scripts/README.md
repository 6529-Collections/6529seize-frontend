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
- `deployment-bus.cjs`: deployment bus manifest, validation, heartbeat,
  production-preflight, and GitHub Deployment status helper.
- `testing-strategy.cjs`: frontend testing strategy risk-floor classifier,
  validation manifest checker, and mutation endpoint registry checker.
- `run-docs-area-remediator-loop.sh`: iterative docs remediation loop.
- `process-docs-commit-queue.sh`: docs update queue helper for commit-based
  remediation workflows.
