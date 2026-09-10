# Product and workflows

Parent: [specification index](README.md). Field definitions: [catalogue](02-field-catalogue.md). Request semantics: [API](03-backend-and-api.md).

## 1. Goals and exclusions

Help artists document an artwork with enough context for serious collection, interpretation and future preservation, without having to finish a long questionnaire at submission time. Give reviewers an organized way to identify and resolve missing information. Preserve the distinction between what the artist said, what the system extracted and what a reviewer concluded.

In scope: modular questions, database autosave, artist records, private original-file delivery, source prefill, permissioned collaboration, version-specific confirmation, review, helpful copy and Keys and Gates onboarding. Later editing of an existing documented work is in scope even when that work has been minted elsewhere; it creates new documentation and makes no token/contract change.

Out of scope: mint preparation, token allocation, chain writes, finality, typed mint signatures, permanent storage publication, public dossier pages, public completion badges, automatic institutional accession, legal e-signature, live interview recording, AI-generated biographies, automatic translation, real-time coediting and a general-purpose form builder.

## 2. Reusable module registry

Each module is a typed implementation with a stable ID/version, data schema, FE editor, read-only summary, validation function, guidance keys and permitted visibility. A program selects registered modules and sets requirements. It cannot inject executable code, arbitrary forms, validators or HTML. Adding a new module needs a code/schema version, not a Keys-and-Gates conditional scattered through components.

| Module ID | Scope | UI group | Responsibility |
|---|---|---|---|
| `identity` | Artist record pinned into work | Artist and contributors | Name, profile, biography, credit and contact |
| `artwork` | Work | Artwork | Title, dates, location, medium, edition and alt text |
| `files` | Work | Artwork | Original files, roles and display/source distinction |
| `context` | Work | Story and process | Caption, statement, context and history |
| `process` | Work | Story and process | Capture, construction, edits, tools and contributors |
| `rights` | Work | Rights and people | Rights representations, depicted people, consent references and private choices |
| `preservation` | Work | Preservation and display | Essential properties and display/conservation preferences |
| `interview` | Work | Preservation and display | Written interview or recording/transcript and permissions |

Review and approve is a presentation of these modules, not a ninth data module. Every module can render in `inline`, `workspace` and `read_only` modes using the same API, normalization and validation. Inline mode may show a registered subset of fields; all saved fields remain visible in the workspace.

Data modules and visual groups are separate. In v1, `process.contributors` is rendered in Artist and contributors through an explicit field-group override, while remaining work-scoped process data. Do not copy contributor credits into the reusable identity record. A field has one workspace editing location, with read-only cross-references where helpful.

A pinned profile configuration has `profile_id`, `version`, ordered module versions, inline field IDs, required-for-review field IDs, reviewer lanes and program guidance references. V1 requirements have exactly two levels: `required_for_review` and `recommended`. They never alter the existing Wave submission gate. Conditional required fields are owned by the typed module (for example, consent status when people are depicted).

Initial profiles are `stream_artwork_basic_v1`, `photography_documentation_v1` and `keys_and_gates_v1`. These are intake profiles, not deployed Stream schema identifiers. Backend code resolves a profile's full configuration and returns it to the FE; snapshot/hash it on context creation. A future version upgrade is an explicit coordinator action with a requirements diff and renewed confirmation. Existing confirmed revisions retain their old profile.

## 3. Entry points and timing

### A. During submission

An enabled Wave's artwork submission UI offers an expandable “Add the story behind your work” section after the normal artwork fields. It contains a short explanation, optional caption/process fields and “Continue later.” The existing required submission fields and signed-drop behavior are unchanged.

Create a documentation work only when the artist chooses to start it; merely opening the composer must not create abandoned rows. Copy title/description/media references into the new draft with `source_kind=unsent_composer`, then let the artist confirm or edit. Never claim an uploaded social image is a preservation master.

Documentation autosaves independently. The signed drop is submitted through the existing drop path. On success, an idempotent association call links its ID to the documentation work after validating author and Wave. If association fails, show “Your submission succeeded. We’ll help you reconnect its documentation.” Retrying only retries association, never the drop. Retain the successful drop ID for that recovery flow. Return the artist to their successful submission, with a documentation link when available.

Optional documentation save failures do not invalidate a successful submission. Warn clearly which text was not saved and allow copying it. Do not add an unsigned documentation field to the existing signed-drop payload. A future atomic/gated submission integration would require its own signed-payload/API change and is outside v1.

### B. After submission or selection

The author sees “Add documentation” or “Continue documentation” on an eligible submission. Program coordinators can invite/import selected works from an explicit approved roster. The action opens the same workspace and modules as inline mode. Selection is source context, not a requirement for generic documentation.

The server resolves an existing work for the same artist/drop before creating one. No changes to votes, rank, drop text, original signatures or source media occur. Never delete the original drop during documentation updates. Source deletion/moderation later removes the live-link availability but retains the authorized source receipt under applicable retention policy.

### C. Later in the work's life

An artist reopens an existing record from “My artwork documentation.” New writing or files create a new working version. The last confirmed/reviewed version remains identifiable. If a future consumer has recorded an older revision permanently, display that relationship as read-only provenance when the consumer supplies it; v1 does not discover or mutate token metadata.

Separate works require separate work IDs. A new photographic edit can be either a correction to documentation or a different work; ask the artist to choose “Update this record” or “Create a separate work” when replacing the canonical artwork image. No silent merging by identical title or image hash.

## 4. Authors, editors and programs

One work has one controlling artist profile in v1. Other contributors receive credits; any claim of co-authorship is explicitly recorded and sent to the rights reviewer. Listing a contributor does not give them editing or confirmation permission. Multiple-author threshold approval is future work, not something inferred from credits.

An artist can explicitly grant a documentation editor to a work. This grant permits allowed draft edits but not artist confirmation. Coordinators assign reviewers and request changes. They cannot approve as the artist or edit an artist-owned module unless separately granted editing permission. Reviewer statements live outside artist-authored fields.

A work may have more than one documentation context. Each context pins its program/profile, module references, disclosure choices and confirmed revisions. Linking a work to a new program must ask the artist which existing content to reuse; no automatic sharing of another program's private documents or comments. V1 only needs UI creation of one context at a time, but the data model must not assume one work equals one program.

Artist-profile reuse also requires a deliberate pin/update. A biography saved for a future work must not change an already confirmed dossier. Context-specific private contacts and consent instruments are never copied automatically.

## 5. Lifecycle and completeness

Maintain independent state dimensions:

- `draft_version`: monotonically increasing context version on successful content/reference changes.
- `confirmation_status`: `unconfirmed | current | newer_draft` derived from the last confirmation and current content snapshot.
- Per-module completeness: `not_started | in_progress | ready | not_applicable | needs_attention`.
- Per-review-lane result for a confirmed revision: `pending | changes_requested | accepted`.
- Context lifecycle: `active | archived`; archiving changes work visibility in lists, not accession status.

“Ready” means required fields are provided in acceptable form or an allowed unavailable/not-applicable explanation is present. It does not mean statements are verified. Recommended fields do not block confirmation and do not produce a red error. A required declaration can be complete while raising a review issue: an artist who truthfully reports unavailable consent is allowed to save and confirm their account, but rights review cannot be accepted without resolution under program policy.

The summary shows two lines: “Required information: X of Y items addressed” and “Review: N of M checks accepted.” Avoid a single universal museum-quality score. For pending private review, unauthorized people see no counts or details.

Confirmation requires no unsaved edits, no file transfers referenced as final still processing, no invalid fields, and all required questions addressed. It creates an immutable documentation revision and an authenticated confirmation receipt. The CTA is “Confirm this documentation,” accompanied by the exact copy in [guidance](05-artist-guidance-and-copy.md). It is not “Sign,” “Mint,” “Publish” or “Accession.”

Reviewer acceptance is bound to that revision and lane. Editing after confirmation leaves earlier review results on the earlier revision; the working version shows “Changes since confirmation.” Reuse of unchanged lane acceptance may be implemented later with an explicit dependency algorithm; v1 requires review of the newly confirmed revision in every configured lane.

## 6. Review and communications

Comment threads attach to a context, module, field path and base version/revision. Comments are plain text with author/date and an explicit audience: `artist_and_reviewers` or `reviewers_only`. Private rights threads additionally require private-evidence access. Resolution is recorded and does not itself accept a module.

The coordinator consolidates actionable questions. Notifications can say “Your artwork documentation has feedback” with an authenticated link. They must not include private statements, original filenames or consent excerpts. Automatic reminders and Wave posting are not part of v1. A request for feedback notifications uses the app's existing preferences and event mechanisms.

## 7. Success measures

Measure starts, server-saved modules, returns, confirmations, review requests and resolutions. Separate inline and afterward entry modes. Track upload failures and save conflicts to improve the experience. Analytics contain opaque IDs and event categories, never field contents, sensitive flags, filenames or document URLs. No gamified public badge, ranking advantage or collection-quality score is awarded for completing a form.
