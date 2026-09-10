# Frontend implementation specification

Parent: [index](README.md). Pair this with [field definitions](02-field-catalogue.md), [API](03-backend-and-api.md) and [exact copy](05-artist-guidance-and-copy.md). All routes/components below are proposed additions.

## 1. Routes and entry points

| Route/surface | Required behavior |
|---|---|
| `/artwork-documentation` | Authenticated “My artwork documentation”; owned/editable work cards, program filter, saved/confirmed/review states, last saved date and continue action |
| `/artwork-documentation/works/[workId]/contexts/[contextId]` | Workspace; `?section=artwork\|story\|artist\|rights\|preservation\|review` selects a group; unknown section safely defaults to Artwork |
| Same route + `/revisions/[revisionId]` | Clearly read-only confirmed snapshot, receipt, lane results and “Return to current draft” |
| `/artwork-documentation/programs/[programId]` | Permissioned coordinator queue, reviewer assignment and follow-up; no public directory |
| Enabled artwork composer | Optional `ArtworkDocumentationInline` module surface; the main submit action remains owned by the existing composer |
| Eligible author's existing drop | “Add documentation” / “Continue documentation”; use verified source association lookup, not client-only ownership |
| Artist profile account menu | “Artwork documentation” entry visible when feature access exists; no public profile completion badge |
| Authorized Keys and Gates coordinator view | Links to pilot roster contexts and source drops; no change to the public Museum catalogue in this delivery |

Keep existing `/stream` behavior: it currently redirects to the public Stream review. Do not replace that route with a private form or fold this feature into the Memes-only claims UI. The feature has no mint/payment actions and should not mount NFT purchasing hooks.

Use request-aware authorization for private data; authenticated backend responses use `Cache-Control: private, no-store`. Private content must not enter a public server cache, shared route payload, static export, sitemap, search index, Open Graph image or error report. Use generic private-page metadata via the existing metadata helper. Keep editor state in Client Components behind a thin App Router shell, following the repository's version-matched Next guidance. [Next's server/client boundary documentation](https://nextjs.org/docs/app/getting-started/server-and-client-components) is a fallback reference, not a reason to duplicate backend authority in the browser.

## 2. Files and ownership boundaries

Recommended placement:

```text
app/artwork-documentation/...                 route shells/loading/error boundaries
components/artwork-documentation/
  ArtworkDocumentationWorkspace.tsx           common workspace host
  ArtworkDocumentationInline.tsx              compact host for submission
  ArtworkDocumentationList.tsx                artist list
  ArtworkDocumentationReviewQueue.tsx         coordinator/reviewer list
  DocumentationSectionNav.tsx                six groups and honest progress
  DocumentationSaveStatus.tsx                 saved/saving/error/conflict
  DocumentationConfirmation.tsx               normalized preview and confirmation
  DocumentationRevisionHistory.tsx           immutable versions
  DocumentationFeedback.tsx                  scoped threads
  DocumentationUpload.tsx                    archival transfer and recovery
  modules/{identity,artwork,files,...}/         editor, summary, field help
hooks/artwork-documentation/                   query/save/upload/source adapters
services/api/artwork-documentation-api.ts      common API wrapper calls
lib/artwork-documentation/                    registry, display rules, safe selectors
```

These boundaries are conceptual; follow existing naming/testing conventions. Reuse existing auth, `common-api`, React Query, forms, dialogs, toasts and multipart primitives where behavior matches. Do not copy Memes traits, token allocation, edition minimums, payment wallet controls, artwork-drop deletion or Drop Forge launch state into this domain. Archive format/limits are separate from social upload limits.

Use the common API wrapper's existing custom-header support for `If-Match`/`Idempotency-Key`, and structured-error mode so 409/422/428 can drive specific recovery states. Endpoint strings passed to that wrapper start `artwork-documentation/...`; the wrapper supplies `/api/`. Derive the next context ETag from the returned `draft_version`. Add profile-scoped React Query keys for work lists, contexts, revisions and review queues; clear them on auth changes and invalidate only affected records after successful writes.

The typed module registry exposes `id`, `schemaVersion`, field descriptors, `Editor`, `Summary`, `getVisibleFields` and guidance keys. Each module receives `answers`, projected field access, resolved requirements, `onChange(operations)` and display mode. Modules do not fetch their own profile policy, submit drops, mint tokens, create contexts or grant permissions. The host owns queries, serialized persistence, source association and navigation. Generated API types are the source for payload shape; UI types can describe interaction state without redefining backend enums.

Resolve visual placement from module groups plus registered field-group overrides. `process.contributors` appears once in Artist and contributors, saves to the process module and contributes to that module's completeness. Error-summary and feedback links resolve to this visual location. Inline field selection uses the same registry, not a second implementation of the field.

Use discriminated module types and exhaustive switches. No `any` bag, server-provided executable renderer or new generic form-builder dependency is needed. Same field IDs, validation messages and help appear inline and in the workspace. Hide module sections unconfigured for the profile; optional configured sections stay reachable without forcing completion.

## 3. Workspace layout

Desktop layout uses a quiet two-column workspace: six-group navigation at left; one active editing section at right; compact work image/title and program context above. A restrained context panel explains value and shows relevant feedback. Do not place a wall of policy above the first field.

```text
< My artwork documentation        [Artwork preview] Title / Program
                                  Saved at 14:32 · Draft
Your work has a history. Keep it with the work.

Artwork                 [3/5]  | Story and process
Story and process       [2/4]  | Your account helps future viewers understand
Artist and contributors [3/3]  | the choices behind the image.
Rights and people       [1/4]  |
Preservation and display [0/3] | Caption                         Required for review
Review and approve             | [                                               ]
                               | 75–150 words suggested for Keys and Gates
                               | [Intended for public record]  [Why this matters]
                               |
                               | [Save and exit]                  [Next section]
```

Numbers above are illustrative, never hardcoded denominators. Server-reported requirements determine actual counts, including conditional questions. All modules are freely navigable; Next section is convenience, not a wizard lock. Group navigation indicates saved completeness, not unsaved optimistic completion. Keep draft save status separate from content completeness.

At narrow widths use one column, a labeled section selector and a compact progress summary. Avoid horizontal tabs requiring hidden scrolling to find Rights or Review. Keep actions clear of mobile keyboard/safe areas; do not require dragging to navigate or upload. The artwork preview uses contain sizing and a neutral background so borders/composition remain visible. A preview is labeled when it is a derivative or source-drop image.

Fields show label, required/recommended status, concise value-oriented help, input, visibility and any error. “Why this matters” expands additional help without losing entered text. Conditional questions appear immediately after their trigger with a brief reason. Unknown/unavailable/withheld controls use the catalogue's permitted statuses; selecting them never generates fabricated values. Contacts and consent documents display “Restricted” with who can access them.

## 4. Inline submission behavior

Place a collapsed optional section after normal artwork input, before the existing final submission review. It offers the caption, process description and artist-information pin selected by the profile, plus a link to the full workspace. The basic submission should remain recognizable.

Do not create a context on mount. Starting the optional section creates it with an idempotency key and captures a source proposal from the composer. Changes to the composer after that are not automatically mirrored over edited documentation. Offer a diff-based “Use updated submission details” action for chosen fields. Documentation changes never silently alter signed drop text.

The host's source adapter takes a successful `dropId` from the existing submission callback, associates it once and reports link status. Do not wrap the drop mutation in the documentation retry handler. On success/failure combinations:

| Drop | Documentation | User result |
|---|---|---|
| Succeeded | Saved and linked | Normal success + Continue documentation |
| Succeeded | Saved, link failed | Normal success + Reconnect documentation; retry association only |
| Succeeded | Unsaved edits | Normal success + specific unsaved-text notice with Copy text / Retry save |
| Failed | Saved | Existing submission error + “Your documentation draft is saved”; retry the drop under existing behavior |
| Cancelled | Saved | Draft remains in My artwork documentation, source marked not submitted |

For recoverable association, retain only opaque work/context/drop IDs in session storage, scoped to profile and bounded to seven days; no answers, signed drop payloads, auth tokens or filenames. If storage is unavailable, keep IDs in memory and expose recovery from My artwork documentation/source-drop action. Refetch and reauthorize after account switches. A failed association should never require resubmitting the work or affect rank/votes.

## 5. Autosave, conflict and recovery

Maintain three distinct values: last acknowledged server state/version, current edit buffer and a serialized pending-operation queue. Debounce saves 800 ms after typing, with a maximum five seconds of continuous typing between attempted flushes. Flush on blur and explicit Save and exit. Client-invalid values stay in the buffer with guidance; do not repeatedly send malformed requests. The 256 KiB context budget must be visible before overflow.

Only one content mutation per context runs at a time in this browser, including file links and identity pins. Attach the latest acknowledged ETag and a stable idempotency key for the logical operation. Edits made during a request remain queued; a late response cannot overwrite newer typing or show “Saved” while the queue is dirty. Switching sections retains the buffer. Upload progress and comments can run independently.

Save states: `clean`, `dirty`, `saving`, `retrying`, `invalid`, `conflict`, `auth_expired`, `offline`. The SaveStatus component announces meaningful transitions politely, not every keystroke. Background refetches never replace dirty fields. Use bounded retry with jitter for transient errors; stop and surface recovery after repeated failures. Do not queue writes indefinitely after permission loss.

On 409, keep local text, fetch the latest authorized state and show base/server/your versions for affected fields. Offer “Use latest” or explicitly “Apply my changes to the latest draft.” The second action patches selected paths against a fresh version; it is not a force-write. Changes outside the edited paths can be accepted automatically after a safe base comparison. Shared artist-record conflicts additionally show the newer biography/credit and require a pin decision. The server remains authoritative even when the FE believes a merge is safe.

On auth expiry, pause saves and uploads, retain the current buffer in memory while the same artist reauthenticates, and make unsaved text copyable. On deliberate profile/account switch, abort in-flight work, clear private query/editor caches and never send the old buffer under the new account. Warn before an intentional switch/navigation with unsaved text. Do not persist private form content to localStorage, IndexedDB, service-worker caches or analytics. A refresh/browser crash can lose unsaved text; never promise otherwise.

Save and exit waits for a successful flush before navigating. In-app route changes with unsaved content offer Stay / Leave with unsaved changes. `beforeunload` is best effort for browser close. File upload progress uses exact byte/processing state; an uploaded file is not shown as preserved/ready until server hashing and checks finish. Successful attachment updates the shared context version through the same save queue.

## 6. Artist confirmation and review screens

Review and approve displays all configured module summaries, with each required item addressed/missing, unavailable explanations and reviewer attention separately. Show language attribution, artist-record revision, final file thumbnail/name/hash details on demand, source-prefill flags, original/master distinction and restricted markers. “Preview future public record” is a private filtered preview with a prominent “Preview only — nothing is published” notice; omit restricted data entirely from the preview response/selector. It is not a new public route or export.

Confirmation is enabled only after all edits are saved, required questions are addressed and referenced assets are ready. Show disabled reasons with links to the exact fields. Display the versioned confirmation copy and an unchecked acknowledgment; the action sends that copy version and current ETag. A confirmation race returns to review with changed fields highlighted. On success show “Documentation confirmed” and “Review pending,” date/revision and a link to view the snapshot.

Later edits show a small “Changes since confirmation” banner and a link to the previous confirmed revision. Never erase earlier accepted checks or display them as current acceptance. In historical mode all fields are read-only with a persistent revision label. Reviewers see lane-specific work, a source/artist/reviewer distinction, comments and Accept / Request changes. They cannot edit artist wording through a review action.

The coordinator queue has work, artist, required-items progress, latest confirmation, lane status, last activity and assigned reviewer columns. Narrow layout uses cards. Filters are local/authorized server fields, not private free-text searches. Batch assignment can be a later convenience; v1 must support per-context assignment and action follow-up. Empty queue, no assignment, restricted evidence, stale version and unavailable source each have distinct states.

## 7. Design, accessibility and localization acceptance

Follow repository [design](../../standards/frontend-design-ui-ux.md), [WCAG 2.2 AA](../../standards/frontend-accessibility-wcag-22-aa.md) and [localization](../../standards/frontend-i18n-localization.md) standards. Use Tailwind `tw-` classes and current dark iron/control patterns. No new Bootstrap, Sass or unrelated design system.

Every input has a persistent label and associated help/error. Required/optional and status never rely on color alone. Use semantic headings/fieldsets, visible keyboard focus, logical focus order, appropriately sized targets, accessible file-selection fallback and error-summary links that focus the input. Dialogs trap/restore focus correctly. At 200% zoom and 320 CSS pixels, controls and text reflow without page-level horizontal scroll. Test reduced motion, keyboard-only operation and screen-reader announcements for upload/save/conflict states.

All product strings have translation keys, including enum labels, alt text templates, visibility, counters, date/time formatting and API error messages. Use locale-aware pluralization and `Intl` segmentation for advisory word counts; hard validation uses the catalogue's character/byte rules. Respect RTL direction and preserve original-script titles/statements. Bilingual editing shows separate attributed variants; changing UI language does not translate or rewrite artist content. Do not append English labels to a translated sentence at runtime.

Use fixtures for incomplete, ready, confirmed, amended, conflicting, restricted, failed-upload, unknown-format and source-unavailable states. Review production-build browser evidence for desktop/mobile layouts, with representative long titles, Bengali text and actual image aspect ratios. Any future change to public Museum UI also follows that repository's Museum visual release gate; this private spec does not authorize such a release.
