# Roadmap Phase 0 Evidence

This directory is the canonical evidence package for roadmap Phase 0. It
records the contract and baseline only; it does not change runtime behavior or
production schema. Repository delivery Phase 3 for this package is tracked by
the pull request and staging deployment, not by the roadmap phase number.

## Approved Baseline

The architectural defaults in the [decision register](./decision-register.md)
are approved as the implementation baseline. Two product policies are
deliberately deferred with named owners and later-phase gates; neither changes
the Phase 1 additive schema or read-API estimate.

The permanent compatibility boundary is every externally reachable GET route
mounted at this baseline. The machine-readable census contains 296 runtime
route shapes: all 183 OpenAPI GET operations and 113 additional runtime-only
routes. Existing `RANK` and `APPROVE` waves always project their immutable
original competition. Native multi-competition hubs always project as
contract-valid chat waves to legacy GET clients. Mutation support is governed
separately.

## Evidence Index

| Deliverable | Evidence |
| --- | --- |
| Vocabulary and exhaustive ownership | [Domain contract](./domain-contract.md) |
| Backend entities, routes, workers, and integrations | [Backend dependency inventory](./backend-dependency-inventory.md) |
| Frontend creation, models, state, and navigation | [Frontend dependency inventory](./frontend-dependency-inventory.md) |
| Permanent external GET contract | [Compatibility manifest](./public-get-compatibility-manifest.md) |
| Frozen OpenAPI and runtime route records | [OpenAPI snapshot](./baseline/public-get-openapi-snapshot.json) and [runtime route manifest](./baseline/runtime-get-route-manifest.json) |
| Representative synthetic contracts | [Fixture matrix](./baseline/representative-fixtures.json) |
| Native resources, commands, and events | [API and event proposal](./native-api-and-events-proposal.md) |
| Desktop/mobile journeys and failure states | [UX and information architecture](./ux-information-architecture.md) |
| Parity definitions and measurement | [Baseline and parity plan](./baseline-parity-plan.md) |
| Signing, authorization, and execution integrity | [Security and integrity review](./security-integrity-review.md) |
| Flags, deployment, rollback, and telemetry | [Rollout, rollback, and observability](./rollout-rollback-observability.md) |
| Product and architecture decisions | [Decision register](./decision-register.md) |

## Source Evidence Convention

Current-state claims cite repository-relative paths from the frontend or
backend repository. Line numbers are intentionally omitted from prose because
the files will evolve; the frozen route manifest records baseline source
lines. Generated models are evidence of the published contract, while the
OpenAPI snapshot is authoritative for documented GET wire shapes.

## Validation Contract

Phase 1 may implement permanent GET contract tests directly from the two
machine-readable manifests and the synthetic fixture matrix. Tests must fail
on path, parameter, authentication, status/error, schema, enum, required/null,
pagination, filtering, ordering, or projection drift. Additions are allowed;
breaking or retargeting a frozen legacy projection is not.
