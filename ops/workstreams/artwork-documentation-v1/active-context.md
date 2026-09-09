# Artwork documentation implementation status

Updated: 9 September 2026. This is active delivery state; source, PR heads and deployment evidence override prose.

## Authorized delivery

Implement the complete modular artwork-documentation specification across the frontend and backend, open PRs, resolve actionable bot review, merge reviewed changes, deploy backend dependencies then frontend to staging, test, then deploy the same reviewed feature to production and test. Mint preparation and permanent publication remain deferred. No artist messages, institutional accession or on-chain action are part of this implementation.

## Source and branches

| Repository                 | Base         | Development branch                   | PR                                                      |
| -------------------------- | ------------ | ------------------------------------ | ------------------------------------------------------- |
| 6529seize-frontend         | `e3302314f9` | `codex/artwork-documentation`        | Not opened                                              |
| 6529seize-backend          | `41dfb41a`   | `codex/artwork-documentation`        | Not opened                                              |
| Backend archival subdomain | `41dfb41a`   | `codex/artwork-documentation-assets` | Integrate into backend development branch before review |

The frontend branch includes the specification from commit `0aa77312e5` as cherry-picked commit `49b7e9a71c`.

## Implementation and validation

- Backend core implements module/profile schemas, generated OpenAPI contract, persistent contexts and artist revisions, authorization, concurrency, confirmation, review, source links and grants. Thirteen real MySQL integration tests passed; privacy review follow-ups and their regressions are being finalized.
- Backend archival files implement dedicated private storage, multipart transfers, bounded asynchronous hashing/inspection, actual malware-status checks, authorized downloads, cleanup, operational metrics and backups. Twenty-seven unit tests and six real MySQL tests passed, including streamed 4 GiB verification and concurrent quota reservations.
- Frontend workspace commit `54e42ed440` implements reusable modules, private list/review/history views, autosave recovery, file metadata, shared artist pins, deliberate empty contexts and the server-filtered public-record preview. Nineteen focused tests passed.
- Submission/drop/account integration, structured API conflicts, help documentation and private sitemap exclusions are implemented. Nine focused integration/privacy suites passed (99 tests). The successful submission and documentation association remain separate recoverable operations.
- The backend API production bundle builds successfully. Frontend production build, responsive browser review, PR bot review and live staging/production checks remain in progress.

New database tables follow the backend's TypeORM entity/export and `dbMigrationsLoop` synchronization convention. No standalone schema migrations are required by the accepted spec's conceptual migration language.

## Release status

No implementation PR, staging deployment or production deployment has completed for this feature. Deploy backend units in this order: `artworkDocumentationStorage`, `dbMigrationsLoop`, `artworkDocumentationProcessor`, `api`, then frontend. Verify scanner, worker, browser uploads and actual backup/restore behavior before enabling artist access. Self-service stays disabled for the production pilot.

Coordinator release recording is pending until exact PR heads and deployment units exist. Record one coupled release request before release merges/deployments and reuse it through production promotion. Keep the automatic pipeline's release-note metadata intact.

## Required closeout evidence

Record final PRs/heads, review resolutions, relevant passing tests, deployed units and order, coordinator outcome, staging and production deployment runs, direct feature checks, and any accurately scoped limitation. Do not mark the feature shipped based on a green build or an enabled navigation link alone.
