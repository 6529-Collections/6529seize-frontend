# Frontend Release Bus integration archive

This directory preserves the frontend side of the Release Bus integration that
was active before the frontend returned to direct, repository-owned staging and
production workflows. The integration was archived so frontend deployment no
longer depends on Release Bus readiness, authorization, operation identity,
composition manifests, authority acquisition, or authority completion, while
retaining an auditable restoration reference.

The archive source commit is:

```text
a9fa98482c000e86161f670c8120c7801046fd01
```

All files under this directory are inert. In particular, archived workflow YAML
is below `ops/archive/`, not the repository-root `.github/workflows/` directory,
so GitHub Actions cannot discover or execute it.

## Contents

- `pre-change/.github/workflows/` contains exact source-commit copies of every
  active deployment, E2E, artifact, or adjacent CI workflow modified by the
  removal PR.
- `removed/.github/workflows/` contains the frontend-only Release Bus,
  production-authority, and former post-completion staging E2E dispatcher
  workflows removed from active use. The corresponding production E2E
  dispatcher is retained as its exact source-commit copy under `pre-change/`.
- `removed/ops/`, `removed/scripts/`, and `removed/__tests__/` contain the
  frontend-only Release Bus models, scripts, fixtures, safety helper version,
  and tests removed or replaced in active paths. The generic artifact archive
  and extraction defenses remain active in
  `ops/scripts/verify-production-artifact.cjs`.
- `guidance/removed/` contains former Release Bus and one-click-production
  runbooks that no longer describe an executable frontend path.
- `guidance/pre-change/` is a deliberately small, grouped set of exact
  pre-change copies of the root agent/README guidance and only the deployment-
  relevant docs, indexes, and skills updated by the removal PR. It is not a
  dump of unrelated repo documentation or skills. The root `AGENTS.md` copy is
  named `AGENTS.archived.md` so agent tooling cannot mistake the historical
  snapshot for active nested instructions. Other archived guidance retains its
  exact source bytes, so relative links reflect the files' original locations
  and are restoration references rather than archive-local navigation.
- Removed tests and scripts are exact historical snapshots. They intentionally
  retain original repository-relative paths and become meaningful only if
  restored to their former active locations.

## Removed from active use

The active frontend no longer contains Release Bus candidate composition,
staging-ref advancement, preflight, staging/production deploy routing,
production authority completion, deployment-bus manifests, operation-bound
artifact selection, Release Bus status/readiness helpers, or their dedicated
contract tests. The old Museum publication hold coupling was also removed from
the active compatibility workflow; its independent strict-adapter and deployed
read-only sweep remain active. Post-completion E2E dispatcher workflows are
also inactive: each canonical deployment now calls its reusable E2E workflow
before releasing the environment lock.

The current frontend paths are documented in
`ops/docs/developer/frontend-deployment.md`:

- a push to `1a-staging` builds and deploys that exact SHA, followed by
  automatic staging E2E; and
- a manual `Web Deploy - PROD` run on `main` builds, independently verifies,
  and deploys the exact artifact, followed by automatic production E2E.

## Theoretical restoration

Restoration would require a separate, reviewed change. At minimum it would:

1. start from the source commit above and compare every archived file with the
   current frontend and backend contracts;
2. copy only the intentionally restored workflows back to the repository-root
   `.github/workflows/` directory and return required scripts, schemas, tests,
   and docs to their original paths;
3. reconcile the archived production artifact-selection helper with all safety
   improvements in the active generic verifier rather than replacing the active
   defenses wholesale;
4. restore and validate the corresponding backend Release Bus endpoints,
   permissions, secrets, variables, operation schemas, and lifecycle behavior;
5. update current workflow contract tests, agent guidance, and deployment skill;
   and
6. validate the complete integration in a non-production review path before
   authorizing any environment mutation.

Copying archived workflow files into `.github/workflows/` by itself is neither a
safe nor a complete restoration. This archive does not contain or change the
backend Release Bus, Deploy Hub, credentials, or environment state.
