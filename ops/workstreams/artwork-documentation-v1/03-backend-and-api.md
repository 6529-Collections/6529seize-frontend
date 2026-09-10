# Backend, persistence and API contract

Parent: [index](README.md). This specifies new behavior, not existing endpoints. Implement in the backend's normal authenticated Express/service/DB layers and publish its OpenAPI contract before FE client generation. Paths below are relative to the existing API base; do not create a second authentication system.

## 1. Domain and storage

Use existing MySQL infrastructure for structured records and restricted S3 storage for bytes. JSON columns hold versioned module payloads, with relational identifiers, authorization, uniqueness and lifecycle fields outside the JSON. Store only an asset ID/object key in the database, never the binary or a durable signed URL. Use UTC timestamps and opaque UUIDs; profile IDs refer to existing stable profile identity, never a mutable handle.

| Proposed table | Important columns and constraints |
|---|---|
| `artwork_documentation_works` | ID, controlling artist profile ID, creator profile ID, created/updated dates; no required token, collection or program ID |
| `artwork_documentation_contexts` | ID, work ID, optional program ID, pinned resolved profile JSON/hash, profile/module versions, draft version, current artist-record revision, latest confirmed revision, active/archived |
| `artwork_documentation_modules` | Context ID + module ID unique, schema version, current JSON, updater and date; eight registered module types only |
| `artwork_documentation_artist_records` | ID, controlling profile ID unique, latest revision ID, record version |
| `artwork_documentation_artist_revisions` | ID, record ID, record version unique, immutable shared identity JSON, actor/date |
| `artwork_documentation_sources` | ID, work/context IDs, source type/ID, immutable authorized source excerpt, retrieval date, digest, importer, field mapping and artist-reviewed flags |
| `artwork_documentation_drop_links` | Drop ID unique, work/context IDs, author profile ID and Wave ID verified from server source; no ownership inferred from request input |
| `artwork_documentation_assets` | ID, owner/context, object key, upload session, original filename, declared/detected MIME, byte size, SHA-256, state, restricted inspection JSON, actor/date |
| `artwork_documentation_asset_links` | ID, context, asset ID, role, label, description, visibility, source credit, derivation references, intended terms; referenced by module manifests |
| `artwork_documentation_revisions` | ID, context + revision number unique, source draft version, immutable normalized snapshot JSON, SHA-256, algorithm/canonicalization versions, actor/date |
| `artwork_documentation_confirmations` | ID, revision ID unique, controlling profile ID, authenticating wallet reference if available, confirmation-copy version, exact accepted copy, server timestamp; no JWT or signature material |
| `artwork_documentation_grants` | Context/program scope, subject profile ID, capability set, grantor/date, revocation date; deny by default |
| `artwork_documentation_reviews` | Revision ID + lane unique current decision, status, reviewer, reason, date; append decision history in audit events |
| `artwork_documentation_threads` / `comments` | Context, module/field target, base draft/revision, audience, restricted class, resolution actor/date; plain-text messages |
| `artwork_documentation_events` | Append-only activity kind, entity IDs, actor/date, old/new version references; no duplicated private field contents |
| `artwork_documentation_idempotency` | Actor + route + key unique, request digest, entity/result reference, expiry; never cache an unfiltered private response |

This is logical table naming; adapt to repository naming and migration conventions without changing semantics. Add indexes for owner + updated date, program + lifecycle + updated date, context + asset state and revision + lane. List routes paginate by opaque cursor, default 25 and maximum 100, with stable `(updated_at, id)` ordering. No full-text index of private documents or EXIF.

The identity editor presents one module, but `private_contact` is a context-only override. It is never stored in the shared artist-record revision. Shared identity saves create a new immutable artist-record revision and pin it to the current context in the same transaction. Other contexts retain their old pin. Two contexts concurrently updating shared identity must compare both context and artist-record versions; neither silently replaces the other's shared record. Expose an explicit “Use updated artist information” action with a diff for other works. A pin must belong to the work's controlling artist; knowing another record/revision ID never permits impersonation through a foreign identity pin.

Assets belong to one context in v1. Reusing files in another context requires an explicit artist-authorized copy of selected references into that context, with new disclosure choices and a fresh authorization boundary. Do not implement cross-user deduplication or expose matching hashes. A backend may physically deduplicate within one owner's storage only if deletion and access remain context-correct; this optimization is unnecessary for launch.

## 2. Access model

Every read, mutation, revision, source receipt, comment, thumbnail and download resolves the same context authorization. An authenticated wallet in a consolidated profile is not proof of real-world identity. Existing proxy/delegation login does not automatically authorize confirmation; use the repository's real authenticated actor/delegation context to enforce the distinctions below.

| Role/capability | Ordinary answers | Restricted evidence | Edit | Confirm | Review/admin |
|---|---|---|---|---|---|
| Controlling artist | Read | Read own | All own draft fields | Yes, direct authenticated artist authority; no editor/proxy substitution | Read artist-visible feedback, grant/revoke editors, archive own context |
| Explicit documentation editor | Read granted context | Only explicitly granted classes | Granted modules/classes | No | Respond to artist-visible threads |
| Program coordinator | Read assigned program contexts | Only explicit evidence grant | No, unless separate editor grant | No | Assign reviewers, track required/review progress, request changes |
| Curatorial reviewer | Read assigned context/revision | No by default | Reviewer comments only | No | Context/history/interpretation lane |
| Technical reviewer | Read assigned context/revision | Granted archival-file class only | Reviewer comments only | No | Files/process/preservation lane |
| Rights reviewer | Read assigned context/revision | Granted rights/consent class | Reviewer comments only | No | Rights/people lane |
| Everyone else | None | None | None | No | None |

Use server-maintained program membership and explicit context grants. A Wave participant, voter, drop author of another work, profile contributor or Drop Forge admin is not automatically a documentation reviewer. V1 needs capabilities `read_context`, `edit_modules`, `read_archival_files`, `read_rights_evidence`, `read_source_receipts`, `read_contact`, `confirm_as_artist`, `review_lanes`, `manage_assignments` and `manage_context`; return an effective, bounded capability description for rendering. Role labels are conveniences, not bypasses.

For a permitted context but prohibited field, return a structural marker `{ "redacted": true }`, without value, filename, URL, free-text error, original hash or asset ID. Even titles of restricted instruments can identify people. Do not return hidden answers to the FE and merely hide their controls. A general coordinator may see a generic “Rights review pending” status, not a sensitive reason. Locked visibility and field/class permissions apply to linked evidence and historical revisions too. The server derives restricted error projections, progress counts and activity summaries with the same rules. The artist sees full addressed/required counts. Other participants see counts only for their permitted fields plus a fixed notice that additional restricted checks exist; conditional denominators must not reveal hidden people/consent answers. The lane's generic pending/accepted result is the coordinator's allowed summary.

Changing an ordinary field to restricted immediately removes it from unauthorized current and historical API projections. Earlier snapshots stay internally immutable; a separate disclosure-access overlay can narrow access to historical values. Broadening access to an earlier snapshot requires explicit artist choice for that revision and never publishes anything. Revocation removes future access, including download issuance; disclose the bounded lifetime of already-issued download links.

Source receipts need their own access projection: a permitted field excerpt inherits that field's current restrictions. Full verbatim receipts are available to the artist and reviewers explicitly granted `read_source_receipts`; a general context read does not return the entire receipt. Narrowing a field also narrows its source excerpts inside this feature. This cannot recall an original Wave post that was already publicly visible; never promise to remove it by changing a documentation setting.

## 3. Versioning and writes

GET context responses return `ETag: "draft-12"`. Every content mutation uses `If-Match: "draft-12"`; missing is 428 and stale is 409 `DRAFT_CONFLICT`. A single monotonically increasing version covers module answers, artist-record pins, attached asset manifests, source imports and profile changes. This prevents a confirmation racing an invisible file/reference change. Comments, upload-part progress and review decisions do not change content version.

Also return `draft_version` in successful JSON responses so existing clients can construct the next ETag without changing every fetch return type. Allow `If-Match` and `Idempotency-Key` in the API's approved-origin CORS policy and expose ETag/request-ID headers where used. Presigned storage CORS separately permits the required PUT/checksum headers and exposes part ETags/checksums for the approved FE origins. Browser integration tests must exercise these cross-origin paths, not only same-origin mocks.

Use field operations, not replacement of a partially redacted module. PATCH accepts typed `set` and `unset` operations at registered field paths; disallow arbitrary JSON Pointer traversal, prototype keys, server-derived fields and cross-module writes. `unset` means unanswered; a provided empty string is invalid where text is required. The server validates the resulting whole module and conditional rules, allowing incomplete drafts while rejecting malformed values. It returns normalized changed fields, new version, completeness and projected review issues. Invalid values never partially commit.

Example request to `PATCH /artwork-documentation/contexts/{id}/modules/context`:

```json
{
  "schema_version": 1,
  "operations": [
    {
      "op": "set",
      "field": "caption",
      "answer": {
        "status": "provided",
        "value": {
          "primary_language": "en",
          "versions": [{ "language": "en", "text": "The artist's caption.", "authorship": "original", "approved_by_artist": true }]
        },
        "intended_visibility": "public_record"
      }
    }
  ]
}
```

An authorized operation preserves redacted/untouched fields. Module versions unknown to the client require an upgrade screen, not a destructive downgrade. A failed write returns the still-current server version. Save response loss is recoverable with an idempotency key: retry the identical operation before fetching/reconciling, never assume a timeout means failure.

All POST and PATCH content mutations require `Idempotency-Key` (UUID). Identical actor/route/key/body retries return the original operation result projected against current access; key reuse with different content returns 409 `IDEMPOTENCY_MISMATCH`. Keep keys at least seven days. Durable unique drop links, revision confirmation and upload-completion constraints continue to prevent duplication after key expiry. Responses do not include stale signed URLs from a previous request.

## 4. Endpoint inventory

| Method/path under `/artwork-documentation` | Contract |
|---|---|
| `GET /profiles` | Authorized available profiles, resolved config/version, guidance version, registered field IDs, limits, enablement and capability flags |
| `GET /works?scope=mine` | Owned/editable context summaries; title/image only if permitted; cursor pagination |
| `POST /works` | `{profile_id, profile_version, program_id?, source_drop_id?, start_mode}`; derives owner from auth or authorized coordinator import; creates work/context and returns IDs/version; source-drop match returns existing authorized context |
| `GET /works/{workId}` | Work identity and caller-visible context list; never exposes hidden program membership |
| `GET /contexts/{id}` | Pinned profile, module projections, version, asset projections, confirmation/review summary, capabilities, source availability |
| `PATCH /contexts/{id}/modules/{moduleId}` | Field operations and expected version; identity additionally requires expected artist-record version |
| `POST /contexts/{id}/artist-record-pin` | `{artist_record_revision_id}`; artist confirms a permitted identity revision; returns diff/new context version |
| `POST /contexts/{id}/source-links` | `{drop_id}`; verify current server author/Wave and uniqueness, retain receipt; idempotent association; never submits/deletes a drop |
| `POST /contexts/{id}/source-imports` | `{source_receipt_id, fields:[{source_path,target_field}]}`; preview first via `GET /contexts/{id}/source-imports/{receiptId}/preview`; chosen import is versioned, editable, never overwrites without confirmation |
| `POST /contexts/{id}/assets/uploads` | Filename, declared size/MIME, intended role/class; reserves quota and returns upload session/part policy; bytes do not enter an ordinary JSON request |
| `GET /contexts/{id}/assets/uploads/{uploadId}` | Authorized current upload state and received parts; no listing of another context's objects |
| `POST /contexts/{id}/assets/uploads/{uploadId}/parts` | Requested part numbers; short-lived, scoped presigned PUT URLs only |
| `POST /contexts/{id}/assets/uploads/{uploadId}/complete` | Ordered part IDs/ETags; idempotent finalize, returns processing state; ETag is not a file digest |
| `DELETE /contexts/{id}/assets/uploads/{uploadId}` | Cancel incomplete transfer; idempotent; cannot delete a referenced ready asset |
| `POST /contexts/{id}/asset-links` | Ready asset ID + manifest role/metadata; context version required; attaching does not automatically choose canonical image |
| `PATCH /contexts/{id}/asset-links/{linkId}` | Allowed metadata/visibility/role changes, version required |
| `DELETE /contexts/{id}/asset-links/{linkId}` | Detach from draft with version guard; reject if still referenced by current module fields; earlier revisions keep references |
| `POST /contexts/{id}/assets/{assetId}/download` | Reauthorize role/class and issue short-lived download or safe derivative URL; never accept object key from client |
| `POST /contexts/{id}/confirmations` | Expected draft version + exact displayed confirmation-copy version; artist-only transaction described below |
| `GET /contexts/{id}/revisions` and `GET /contexts/{id}/revisions/{revisionId}` | Paginated history/read-only projected snapshot, receipt and version-specific reviews |
| `GET/POST /contexts/{id}/threads` | List permitted threads or create field/module thread with explicit audience/base revision |
| `POST /contexts/{id}/threads/{threadId}/comments` | Plain-text comment, 4,000 characters; no arbitrary external image embeds |
| `PATCH /contexts/{id}/threads/{threadId}` | Resolve/reopen with thread version; no changing audience after private text exists |
| `PUT /contexts/{id}/revisions/{revisionId}/reviews/{lane}` | Assigned lane, decision, reason and expected review version; cannot review an unconfirmed working draft as accepted |
| `GET /programs/{programId}/contexts` | Authorized coordinator queue; filters by confirmation, assigned lane, outstanding action and profile version |
| `GET/POST /contexts/{id}/grants` and `DELETE /contexts/{id}/grants/{grantId}` | View/manage allowed editor/reviewer grants; no self-elevation; program role assignments through existing admin authority |
| `POST /contexts/{id}/profile-upgrades/preview` and `POST /contexts/{id}/profile-upgrades` | Proposed registered profile/version diff; explicit coordinator application changes draft version, requires artist reconfirmation |
| `PATCH /contexts/{id}` | Lifecycle active/archived only, with version guard; restore supported; archive is not delete |

The source-import preview is read-only; applying an import needs the expected draft version. Initial unsent-composer values travel in typed module operations after creation, with provenance recorded as client proposal. A coordinator roster import can resolve a verified drop author to create a work for that artist; it cannot nominate an arbitrary unverified owner. Bulk import is an operator command over the same service, with dry-run output and per-item idempotency, not an unrestricted public bulk API.

Resolve program/Wave configuration server-side. A caller cannot choose the Keys and Gates profile to gain reviewer access. Basic self-service context creation is feature-flagged; roster-only pilot creation requires program permission. Document all schemas, field-specific status allowances, limits, errors, capability projections and response examples in backend OpenAPI. FE-generated files remain generated.

Source receipts are separately bounded at 256 KiB of verbatim UTF-8 text per receipt, up to 30 receipts/context, outside the answer-payload budget. If a source is larger, keep a source reference and a clearly identified bounded excerpt, never label a truncated excerpt as the full source. If an imported answer exceeds its field limit, show the original in the receipt and ask for an artist-approved shorter answer; do not silently truncate it. Import previews and source access use the same authorization as reads.

## 5. Confirmation and review transaction

1. Authenticate the controlling artist and check direct confirmation capability. Require `If-Match` and idempotency key.
2. Lock the context; verify pinned schemas/profile and all required questions addressed. All referenced assets, including evidence, must be ready. Unattached uploads do not block confirmation.
3. Materialize a snapshot of answers, pinned identity, profile configuration, source attributions, asset IDs/hashes/roles/terms and disclosure selections. Do not embed signed URLs, JWTs, storage credentials or reviewer conclusions in artist statements.
4. Apply the documented NFC/LF preprocessing to artist answer strings before serialization, then serialize with [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785), and hash the canonical UTF-8 bytes using SHA-256. JCS itself does not normalize Unicode. Record `canonicalization = artwork-documentation-jcs-nfc-lf-v1` and `hash_algorithm = sha256`; reject duplicate keys, lone surrogates, non-finite numbers and ambiguous date encodings. Source receipts retain their separately stored verbatim bytes/digests; the snapshot references those receipts rather than rewriting them. This is internal fixity, not a Stream signed payload.
5. Write the immutable revision, confirmation receipt, pending lane rows and audit event in one transaction. Update latest confirmation pointer. An identical already-confirmed snapshot returns its existing confirmation instead of creating another revision.
6. Return revision ID/hash, receipt, confirmation state and pending reviews. Never report success before transaction commit.

The confirmation screen renders the same normalized data that is hashed. For large private evidence, the manifest identifies bytes by hash and file metadata; it does not hash mutable object URLs as content. A server-verified digest demonstrates later byte equality, not authorship, truth, ownership or legal validity.

Review decisions reference an immutable revision, reviewer lane and evidence. Accept is prohibited while that lane's server-computed hard issues remain. `changes_requested` requires an artist-visible actionable reason; sensitive details use the restricted thread class. A reviewer may reopen their lane with a reason; decision history survives. Archive does not erase history or turn pending review into accepted. Program completion means every configured lane accepted on the same revision, with no claim of accession or mint readiness.

## 6. Byte-preserving uploads

Create a dedicated private ingest/final-original prefix and archival upload policy. Do not route originals through the social drop sanitizer, publish them through its CloudFront URL, or alter existing drop behavior. Copy/promote exact received bytes after validation; derive previews separately, strip sensitive metadata from previews and keep each derivative linked to its original. A social preview imported by URL is a source reference until an authorized byte upload is separately verified.

Launch defaults, exposed by API: 4 GiB per asset, 20 GiB stored plus reserved bytes per context, 100 assets per context, five concurrent upload sessions per context; 16 MiB parts, at most three simultaneous part requests per browser. Allow a program administrator to raise bounded quotas after capacity review, not a client-supplied override. Large photographic masters should not inherit the Memes 250 MB ceiling.

Initial allowed roles/formats: final/display images JPEG, PNG, TIFF, WebP and GIF; archival/source images also HEIC/HEIF, DNG and common camera RAW formats; working files PSD/PSB and XMP sidecars; documents PDF and UTF-8 TXT/Markdown; interview audio WAV/FLAC/MP3/M4A and video MP4/MOV. SVG, HTML, executables and arbitrary archives are excluded in v1. Validate extension, magic/format where supported and declared size; store unknown vendor RAW parsing outcomes honestly. The backend owns a concrete extension/MIME/magic allowlist, including CR2/CR3, NEF/NRW, ARW, RAF, ORF and RW2, rather than a wildcard RAW extension. Preserve supported archival formats that cannot be rendered; show a file card rather than a broken image. No inline rendering of uploaded Markdown/HTML/XMP; PDF/documents use authenticated download or an isolated safe viewer, never active same-origin content. XMP extraction must disable external entities and network resolution.

File state: `created -> uploading -> processing -> ready`, with `failed`, `quarantined`, `cancelled`, `expired` terminal/recovery states. Server workers stream SHA-256/size checks with bounded memory, perform malware checks under existing infrastructure and safe format inspection with time/pixel/memory limits. Unsupported metadata inspection may yield a ready file with `inspection_status=unsupported`; failed safety validation may not. Surface genuine original dimensions without requiring upscaling. The ready state requires a completed server digest and byte count.

Presigned part URLs expire after 10 minutes; reissuing requires current authorization. Incomplete sessions expire after 24 hours and orphan bytes are removed within seven days. In-session network retries resume accepted parts; after refresh, artists reselect the original file. Durable resume must verify SHA-256 hashes of the completed local parts against stored part checksums before reusing them, including the last short part; matching filename/size/mtime alone is insufficient. Changed bytes start a new session. Where browser/memory support cannot perform this check reliably, explicitly restart the upload; never concatenate parts from two different files. A mobile background interruption shows reconnect/reselect recovery, not a promise of background delivery.

Finalization verifies actual size against quota and declared size, reconciles reserved bytes atomically and handles duplicate completion safely. Assets are not attached to a revision until ready. A ready but unattached asset expires after seven days with visible notice; ready assets referenced in any draft/revision are retained while that documentation is retained. Replacement does not garbage-collect the previous confirmed original.

Original-byte downloads, including a final image intended for public presentation, require the artist's access or explicit `read_archival_files` capability; rights/consent instruments instead require `read_rights_evidence`. The ordinary context reader gets only authorized metadata and a sanitized derivative. This prevents embedded GPS or personal metadata from bypassing restricted inspection-field access. A visibility choice for future publication does not grant original-byte access now.

Downloads expire after five minutes, use attachment disposition for unsupported/active formats, `nosniff`, and private/no-store cache headers. Serve ordinary artwork previews only after authorization. Do not log signed query strings. Already-issued bearer links may remain usable until expiry; the UI must not promise instantaneous recall. Auth revocation, expired sessions and quarantine are explicit states.

## 7. Error and operational requirements

Use existing API error conventions with stable domain code, safe message key, request ID and allowed field errors. Return 401 for expired authentication; 404 for inaccessible entities (including other users' assets); 403 for a prohibited operation inside a visible context; 409 for version/idempotency conflicts; 413 for request/quota limits; 422 for malformed/conditional field values; 429 with retry guidance. Restricted causes are summarized for unauthorized callers.

Autosave, confirmations and asset references must survive backend retries without partial records. Queue processing is idempotent; expose upload/inspection failure as retryable versus terminal. Monitor counts, latency, failed jobs, quota pressure and conflicts using IDs only. Disable request-body capture, session replay and analytics payload recording for these endpoints/pages. Access logs redact signed URLs and private query parameters.

Back up the database and private originals through existing infrastructure, test restoring a sample revision together with matching asset bytes, and document the operational owner before pilot onboarding. Archiving is reversible and does not delete evidence. V1 has no artist-facing permanent-delete button; a deletion request uses the existing support channel and an authorized operator runbook covering current data, historical snapshots, copies and backup expiry. Retain only a non-content tombstone when deletion is required; never silently edit a supposedly immutable snapshot. Do not promise permanent preservation or a new retention period without an adopted institutional policy.

No IPFS gateway, Arweave funding, mint worker, contract listener, token-ID allocator or Stream transaction signer is needed to deliver this API.
