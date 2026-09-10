# Artwork documentation delivery evidence

Updated: 10 September 2026. Backend and frontend are deployed and verified in production. The Keys and Gates pilot has 16 private workspaces for 15 artists. Software delivery and production onboarding setup are complete; artists still supply and confirm their records.

## Authorized delivery

Implement the complete modular artwork-documentation specification across the frontend and backend, open PRs, resolve actionable bot review, merge reviewed changes, deploy backend dependencies then frontend to staging, test, then deploy the same reviewed feature to production and test. Mint preparation and permanent publication remain deferred. No artist messages, institutional accession or on-chain action are part of this implementation.

## Reviewed implementation

| Repository | Merged PR                                                                 | Reviewed head                              | Main merge                                 |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Backend    | [#1981](https://github.com/6529-Collections/6529seize-backend/pull/1981)  | `36ebc0f62d8d9283423bdc612daf2287fca983b0` | `5c990e9dbe762277cc13ecfa36f1bc9a58375eef` |
| Frontend   | [#3924](https://github.com/6529-Collections/6529seize-frontend/pull/3924) | `856b4619091de530cf5c85f7b55c15268d0401c4` | `63cc58ed747e15d971d124a39b6d1c326f2bc5ba` |

Both PRs passed their final required checks. Actionable bot findings were fixed or explicitly dispositioned, with no unresolved review threads at merge. Review evidence covers CodeRabbit and the configured DCO, Snyk, Sonar and frontend CodeQL checks.

## Implementation and validation

- The implementation provides eight reusable modules, private database drafts, artist identity pins, permissioned review, immutable confirmations and byte-preserving archival uploads. Submission, later drop and standalone entry points reuse the same domain. Artist guidance explains its purpose and distinguishes present privacy from intended future publication.
- [Final backend CI](https://github.com/6529-Collections/6529seize-backend/actions/runs/34423509048) passed 3,599 tests across 371 suites, generated-file checks, lint and production builds.
- [Final frontend CI](https://github.com/6529-Collections/6529seize-frontend/actions/runs/34425280288) passed 6,858 tests across 983 distinct direct/related suites, production build, both browser packs and quality/type checks. Overlapping preliminary tests are excluded from these totals.
- Actual staging API/browser/storage checks passed saves/reloads, conflicts and idempotency, server-side privacy, immutable confirmation/retry/amendment, denied unassigned review, original hashes, sanitized previews, unsigned-access denial, 17 MiB multipart/checksum/resume and EICAR quarantine/denial. The streamed 4 GiB fixture is unit evidence, not a claim of a live 4 GiB upload.
- Corrected native browser recovery completed an existing accepted upload, reached verified/ready state, attached with restricted visibility and retained its original hash. Desktop, 390px mobile and keyboard checks passed with no browser or CSP errors. Actual browser checks did not mock API responses or bypass CSP.
- Recovery acceptance A32 passed: a bounded consistent backup restored 24 synthetic rows across 13 tables into an isolated database, matching all contents, canonical snapshot digest, artist pins and asset references/versions. An actual AWS Backup restore to a separate private bucket matched the confirmed original's bytes, size and hash. This is a sample logical and original-file restore, not a full RDS disaster-recovery exercise.
- Production API tests passed auth/privacy, saves/replays, stale/version-key rejection, required-answer validation, immutable confirmation/amendment and reviewer denial. A real small PNG passed malware processing/fixity checks and denied unsigned original access. General self-service creation was rejected and accessible context IDs remained unchanged. Production browser checks passed 11 assertions: actual saves/reloads, server-filtered privacy, native original-file upload and accepted-part resumption, restricted attachment, preserved confirmed history, and mobile/keyboard use, with no browser or CSP errors.

New database tables follow the backend's TypeORM entity/export and `dbMigrationsLoop` synchronization convention. No standalone schema migrations are required by the accepted spec's conceptual migration language.

## Release status

Backend units deployed sequentially: `artworkDocumentationStorage` → `dbMigrationsLoop` → `artworkDocumentationProcessor` → `api`, followed by frontend. Database deployment includes successful migration invocation. Completed deployments passed immutable-artifact verification and applicable live version/health checks.

| Environment | Unit           | Successful deployment                                                                          |
| ----------- | -------------- | ---------------------------------------------------------------------------------------------- |
| Staging     | Storage        | [34418324028](https://github.com/6529-Collections/6529seize-backend/actions/runs/34418324028)  |
| Staging     | Database       | [34418662995](https://github.com/6529-Collections/6529seize-backend/actions/runs/34418662995)  |
| Staging     | Processor      | [34418874327](https://github.com/6529-Collections/6529seize-backend/actions/runs/34418874327)  |
| Staging     | Final API      | [34424467018](https://github.com/6529-Collections/6529seize-backend/actions/runs/34424467018)  |
| Staging     | Final frontend | [34426421061](https://github.com/6529-Collections/6529seize-frontend/actions/runs/34426421061) |
| Production  | Storage        | [34425134277](https://github.com/6529-Collections/6529seize-backend/actions/runs/34425134277)  |
| Production  | Database       | [34425364383](https://github.com/6529-Collections/6529seize-backend/actions/runs/34425364383)  |
| Production  | Processor      | [34425589404](https://github.com/6529-Collections/6529seize-backend/actions/runs/34425589404)  |
| Production  | API            | [34427297955](https://github.com/6529-Collections/6529seize-backend/actions/runs/34427297955)  |
| Production  | Frontend       | [34427550011](https://github.com/6529-Collections/6529seize-frontend/actions/runs/34427550011) |

Final staging sources are API `67853a60aa0be8c4507a89d7d8685dbac77710d6` and frontend `06a0ee69cb5f6a51c25f37eecd7a4e194ff8b18c`. Production uses the main merges above.

One coupled Coordinator request recorded this release and was reused through corrections and production promotion: `3ddbb443-0244-4e5c-a37b-26bb18c24a90`, [inbox #37](https://github.com/6529-Collections/6529-release-coordinator/issues/37), [successful recording workflow](https://github.com/6529-Collections/6529-release-coordinator/actions/runs/34418228347). Automatic release-note grouping was preserved.

The final staging [E2E 34427116872](https://github.com/6529-Collections/6529seize-frontend/actions/runs/34427116872) passed 12 packs against deployment `34426421061`: 188 test executions passed, 26 skipped. Production [E2E 34428721234](https://github.com/6529-Collections/6529seize-frontend/actions/runs/34428721234) passed 11 packs against deployment `34427550011`: 74 passed, none skipped. Both verified the exact deployed source; neither had failures, flaky results or infrastructure failures. Museum-specific packs were excluded by the existing change selector. Deployment-triggered E2E is separate from the direct feature checks.

## Pilot state and remaining human work

The feature is enabled while general production self-service remains closed. The actual IAM production import created exactly 16 private workspaces for 15 artist identities in `6529NM-AP-01`, matching the pinned sources and dry run. An identical retry returned all the same source, work, context and owner IDs. An unassigned bot received the same generic 404 as unknown-context controls for all 16 artist contexts and 16 previews; its complete accessible-context list remained unchanged. Staging lacks those commission sources. Source receipts and proposals do not become artist-confirmed answers automatically.

Artists can use their individual workspace links or the authenticated [artwork documentation workspace](https://6529.io/artwork-documentation). The assigned coordinator can use the [program queue](https://6529.io/artwork-documentation/programs/6529NM-AP-01). Individual workspace links were prepared for handoff; no invitations were sent. [The workstream specification](README.md) remains the implementation and onboarding reference.

The production storage audit verified private/versioned/encrypted buckets, active malware protection, an exact one-bucket daily backup selection, 35-day backup retention and an isolated restore destination. The new production vault had no recovery point at audit time; the completed restore exercise was in staging.

Only synthetic bot records were completed for deployment tests. Artists still supply and confirm their information; coordinators assign appropriate reviewers and review each confirmed version. Two invited-artist usability sessions, actual 200% browser-zoom verification and assistive-technology review remain human follow-ups. Headless shortcuts and a bounded extension attempt did not establish actual zoom; resized viewport coverage is not represented as 200% zoom. Valid-session browser checks do not cover wallet signing or session renewal.

No artist messages, votes, custody changes, accession actions or minting were performed. A feature release is not completion of the commission's documentation or a claim that Stream is production-ready. Rollback preserves drafts, revisions and originals: disable availability and deploy compatible code through the existing pipeline rather than dropping tables or deleting retained objects/backups.
