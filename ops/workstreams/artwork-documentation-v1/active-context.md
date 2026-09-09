# Artwork documentation implementation status

Updated: 9 September 2026. This is active delivery state; source, PR heads and deployment evidence override prose.

## Authorized delivery

Implement the complete modular artwork-documentation specification across the frontend and backend, open PRs, resolve actionable bot review, merge reviewed changes, deploy backend dependencies then frontend to staging, test, then deploy the same reviewed feature to production and test. Mint preparation and permanent publication remain deferred. No artist messages, institutional accession or on-chain action are part of this implementation.

## Source and branches

| Repository                 | Base         | Development branch                   | PR                                                                        |
| -------------------------- | ------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| 6529seize-frontend         | `cfdea09eff` | `codex/artwork-documentation`        | [#3924](https://github.com/6529-Collections/6529seize-frontend/pull/3924) |
| 6529seize-backend          | `2406a191`   | `codex/artwork-documentation`        | [#1981](https://github.com/6529-Collections/6529seize-backend/pull/1981)  |
| Backend archival subdomain | `41dfb41a`   | `codex/artwork-documentation-assets` | Integrated into the backend PR                                            |

The frontend branch includes the specification from commit `0aa77312e5` as cherry-picked commit `49b7e9a71c`.

## Implementation and validation

- Backend core implements module/profile schemas, generated OpenAPI contract, persistent contexts and artist revisions, authorization, concurrency, confirmation, review, source links and grants. Thirteen real MySQL integration tests passed; privacy review follow-ups and their regressions are being finalized.
- Backend archival files implement dedicated private storage, multipart transfers, bounded asynchronous hashing/inspection, actual malware-status checks, authorized downloads, cleanup, operational metrics and backups. Twenty-seven unit tests and six real MySQL tests passed, including streamed 4 GiB verification and concurrent quota reservations.
- Frontend workspace commit `54e42ed440` implements reusable modules, private list/review/history views, autosave recovery, file metadata, shared artist pins, deliberate empty contexts and the server-filtered public-record preview. Nineteen focused tests passed.
- Submission/drop/account integration, structured API conflicts, help documentation and private sitemap exclusions are implemented. Nine focused integration/privacy suites passed (99 tests). The successful submission and documentation association remain separate recoverable operations.
- Backend API and frontend production builds passed. Nine desktop/mobile browser assertions passed with synthetic API fixtures, covering save/reload, conflicts, public preview privacy, revision history and separate contexts. Actual staging/production checks remain pending.
- CodeRabbit review findings are being resolved in both PRs. Frontend review fixes pass 30 focused tests, typecheck, ESLint and Knip; React Doctor reports 94/100. Final CI and production builds will be repeated after the review commits.

New database tables follow the backend's TypeORM entity/export and `dbMigrationsLoop` synchronization convention. No standalone schema migrations are required by the accepted spec's conceptual migration language.

## Release status

Both implementation PRs are open. No staging or production deployment has completed for this feature. Deploy backend units in this order: `artworkDocumentationStorage`, `dbMigrationsLoop`, `artworkDocumentationProcessor`, `api`, then frontend. Verify scanner, worker, browser uploads and actual backup/restore behavior before enabling artist access. Self-service stays disabled for the production pilot.

Coordinator release recording is pending until exact PR heads and deployment units exist. Record one coupled release request before release merges/deployments and reuse it through production promotion. Keep the automatic pipeline's release-note metadata intact.

## Required closeout evidence

Record final PRs/heads, review resolutions, relevant passing tests, deployed units and order, coordinator outcome, staging and production deployment runs, direct feature checks, and any accurately scoped limitation. Do not mark the feature shipped based on a green build or an enabled navigation link alone.
