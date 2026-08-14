# Public Contract Reviews

## Overview

Public Contract Reviews are source-pinned, versioned reading rooms for proposed
6529 contracts. They combine plain-language editorial pages with exact source
links and a canonical readiness ledger so artists, community members, technical
reviewers, and auditors can examine the same candidate before deployment.

The first review covers 6529 Stream, an attempt to build a complete,
artist-centered contract system for serious one-of-one digital art. Stream is
in public review, with independent audit and deployment ahead. The overview
explains the protocol in plain language. **Where Development Stands** preserves
the evidence state of each immutable review snapshot.

## Availability

The Stream review is published on:

- local development at `localhost` or `127.0.0.1`
- the shared `staging.6529.io` host
- the production `6529.io` host

The complete public boundary applies while the review lifecycle is `DRAFT`.
In that state:

- the NFT navigation does not show the review
- `/stream` and all editorial, technical-reference, source, declaration-search,
  and feedback-ledger routes return the standard not-found behavior
- review pages are excluded from the sitemap
- review content is excluded from server tracing
- review records are omitted from help and agent corpora
- generated raw review evidence and editorial content are omitted from the
  packaged site artifact
- discussion destinations are not rendered

Publication also requires the environment and lifecycle gates to agree.

## Entry Points

- `/reviews/6529-stream`: active review overview
- `/reviews/6529-stream/{page}`: one of fourteen active editorial pages
- `/reviews/6529-stream/versions/{version}`: versioned overview
- `/reviews/6529-stream/versions/{version}/{page}`: versioned editorial page
- `/reviews/6529-stream/reference`: active generated technical reference
- `/reviews/6529-stream/versions/{version}/reference`: immutable generated
  technical reference
- `/reviews/6529-stream/feedback`: searchable public feedback ledger
- `/reviews/6529-stream/versions/{version}/feedback`: immutable,
  version-filtered public feedback ledger
- `/stream`: gated convenience redirect to the active overview

When enabled, **NFTs > 6529 Stream — Review** appears after the live collection
links and before NFT Activity.

## What Readers See

Every page includes:

- a persistent status area showing the lifecycle, deployment, and audit states;
  Stream currently shows **Public review**, **Preparing for launch**, and
  **Audit planned**
- consistent **Technical reference**, **All public feedback**, and **Review
  history** destinations on current pages
- a link to the exact source snapshot; saved snapshot pages also show their
  exact review version and a link back to the current review
- navigation across the fourteen pages in the current version snapshot
- an on-page contents list generated from the displayed editorial headings;
  the simplified current Overview intentionally has no technical subsection list
- previous and next page controls
- a collapsible page-feedback rail that reads existing comments and includes a
  structured feedback form bound to the immutable displayed review version

The current overview opens with a broad introduction for artists, collectors,
and the wider community, followed by five important parts of a Stream artwork,
a seven-step artwork journey, and focused starting points for artists,
collectors and minters, and auditors. It ends after those audience paths. The
secondary **Review history** destination opens the immutable technical Overview
for the active snapshot. The current **For Artists** page starts with a plain
artist guide covering six decisions: what artwork to publish; whether it is
unique or an edition; how collectors can get it; where the money goes; what the
artist approves; and what can change or become permanent. A six-stage guide
shows how the artwork moves through Stream and keeps finality separate from
ending minting, freezing settings, and recording preservation evidence. A
focused approval checklist separates the details covered by the artist's wallet
signature from the wider artwork plan. A three-part sales and payments guide
now follows that checklist before the page explains what can still change. A
four-part roles summary explains how
the community, signing wallet, Stream operators, guardian, and outside services
can affect what happens. It then presents the technical detail in fifteen short
sections. The sections use reviewed-code, accepted-design, and still-proposed
labels so readers can tell what is safe to rely on. The generated technical
reference lets reviewers
inspect Solidity files, definitions, functions, events, errors, and other
declarations within the review. Its all-declarations explorer queries the server
with the active text, kind, scope, and location filters and loads up to 100
matching records at a time.

The current **Tokens, Collections, and Minting** page starts with a one-minute
explanation. It then separates permanent Core identity from replaceable minting
rules, explains the two source mint paths, and labels the proposed ADR 0018
replay change as unimplemented. It keeps the snapshot's section anchors for
feedback. Immutable version routes retain the original technical editorial.

The current **Changes, Emergencies, and Future Contracts** page starts with a
short explanation of setup sealing, delayed governance, incident pauses,
permanent powers, and replacement contracts. It keeps current Solidity,
accepted ADR design, open risks, and launch evidence separate. In particular,
it explains that the pinned executor's 30-day successor class and the module
registry's 48-hour registration path are separate code paths that still need an
exact launch changeover catalog.

The current **Randomness** page starts with a one-minute answer and a five-step
request flow. It keeps reviewed contract behavior separate from accepted ADR
0005 design and open recovery ideas. It then explains provider trust, request
states, seed evidence, same-seed retries, stale requests, provider changes,
burns, funding, risks, and reviewer questions in plain language. Its saved
version routes keep their exact editorial snapshot.

The current **Metadata, Scripts, and Dependencies** page begins with a one-minute
answer. It separates behavior in the pinned Solidity from the accepted metadata
ADR, the unbuilt satellite refresh helpers, and external compatibility evidence.
It then keeps the detailed material on storage, encoding, scripts, dependency
versions, collection records, snapshots, shared contract metadata, refresh
events, size limits, browser assumptions, failure cases, and reviewer questions.
Its immutable version route keeps the exact historical editorial.

## Implementation and Evidence Status

The current **Where Development Stands** page begins with a direct launch answer:
Stream is not ready yet. It lists the three remaining launch gates in plain
language and shows the last checked date plus the open release-blocker count.
The next sections explain the scope and use five plain progress labels both in
the guide and as later section names. They keep built code separate from safety
evidence and accepted plans separate from unaccepted designs. A plain proof
table then explains what each kind of evidence shows and does not show. Exact
commit and Git tree values follow under **Technical details**.
The current **Community Review** page begins with six plain-language review
questions and the authorship disclosure. The launch answer and review questions
appear only on their current, unversioned routes. Immutable version routes keep
their exact editorial snapshot and historical authorship disclosure.

The plain Overview guide appears only on the unversioned Overview and replaces
the versioned technical Overview there. Its on-page section navigation and
feedback section choices therefore omit the hidden technical headings. A link
from the current review-wide navigation opens its immutable technical editorial.
Immutable version routes show their exact review version and continue to
describe their exact review snapshot.
The plain artist guide and its short technical detail layer follow the same
rule: they appear only on the current, unversioned **For Artists** route and
replace the versioned editorial there. Immutable version routes continue to
render their exact editorial snapshot without the guide.
The plain governance explanation follows the same current-route rule. Immutable
**Changes, Emergencies, and Future Contracts** routes keep their exact saved
editorial instead of receiving later wording.

The current, unversioned **Curation and TDH Authorization** page follows the
same snapshot boundary. It replaces the active snapshot's editorial with a
plain, status-first explanation while keeping the existing section anchors.
It separates ADR 0001's accepted design from behavior proven by the pinned
Solidity, and separates both from launch, audit, and offchain evidence. Saved
version routes keep their exact historical editorial.

The active review centralizes snapshot implementation and evidence status on
**Where Development Stands**. It separates five implementation states:

- current candidate path
- connected foundation
- source implemented, not connected
- accepted target, not implemented
- proposed or deferred

Testing and audit remain a separate evidence dimension. Topical pages use
precise verbs next to each claim and link to the canonical ledger.

The development-status source is
`config/public-reviews/6529-stream.development-status.json`. A routine update
changes its canonical UTC timestamp, exact Stream source commit, plain-language
items, evidence counts, and evidence links in one reviewed JSON file. The
current page uses its checked date and open-blocker count in the plain launch
answer. Run
`./bin/6529 run public-review:knowledge` and
`./bin/6529 run help-index:sync` after each update. The parser validates the
record shape, identifiers, source identity, timestamp, counts, internal review
links, and repository evidence paths.

## Editorial Content

Editorial source lives under
`content/public-reviews/6529-stream/versions/{version}/editorial/` as plain
UTF-8 Markdown. Active and historical routes both load from their exact
immutable version directory. The shell validates the editorial manifest
against that version snapshot's source commit, page IDs, page titles, and
filenames before rendering. Each version owns its page topology and source
metadata, so adding or renaming a page in a later review cannot change an older
route. The shell then derives collision-safe on-page anchors from level-two
headings.

The shell, status, navigation, audience, evidence, and metadata copy use the
shared message system. The long-form Stream editorial is currently maintained
in `en-US` only and falls back to English for all supported locales. Localized
editorial versions are follow-up work; the English-only state must remain
visible in future language controls.

## Help Bot Knowledge Pack

Each retained Stream version also owns a generated Help Bot knowledge pack
under
`ops/public-review-knowledge/6529-stream/versions/{version}/knowledge/`. The
pack is derived offline from that version's editorial manifest, generated
Solidity reference, readiness evidence, risk register, and pinned source
commit. Staging packaging projects only published versions into
`/review-data/6529-stream/versions/{version}/knowledge/`; this keeps the
generated source corpus outside the protected reference-snapshot tree while
preserving the existing review-data runtime namespace. It contains:

- a checksummed manifest binding the review version, commit, reference bundle,
  editorial corpus, publication status, record inventory, and shard paths
- a compact search catalog for deterministic symbol/selector/topic lookup and
  weighted conceptual retrieval
- bounded content shards containing the selected editorial, technical, status,
  risk, and release evidence supplied to the answering backend

The exhaustive records do not enter the generic `/help-index.json`; that index
keeps only concise Stream routing and summary records. The backend first reads
the published review index, validates the active knowledge identity, searches
the compact catalog, and fetches only the shards needed for a bounded evidence
packet.

`./bin/6529 run public-review:generate` regenerates the active knowledge pack
after the Solidity reference. `./bin/6529 run public-review:check` verifies
deterministic bytes, exact coverage, checksums, and version identity. Staging
packaging validates the pack against the same publication entry and reference
bundle used by the pages. There is no separate Help Bot publication flag:
public versions include matching knowledge and `DRAFT` versions include none.
The active pack also contains the dated development update with its separate
Stream source commit.

## Lifecycle Capabilities

The reusable review module supports `DRAFT`, `SCHEDULED`, `PUBLIC_REVIEW`,
`REVIEW_CLOSED`, `REMEDIATION`, `AUDIT`, `FINAL_CANDIDATE`, `DEPLOYED`, and
`ARCHIVED`. A single lifecycle capability map controls public routes, new
feedback, and the security-reporting policy:

- every state except `DRAFT` exposes public routes
- only `PUBLIC_REVIEW` accepts new public feedback
- only `PUBLIC_REVIEW` sends possible exploitable vulnerabilities to the
  review Wave
- `DEPLOYED` changes security reporting to the configured post-deployment
  disclosure policy

In `DRAFT`, the same gate hides the review from navigation, returns not-found
for editorial, technical-reference, source, declaration-search, and ledger
routes, and omits raw generated evidence plus editorial files from staging
packages. Review-tagged Help Bot records and the agent artifacts generated from
them are omitted as well. The lifecycle gate and environment gate must both
permit publication before any public review surface is available.

Status copy and chips are selected from the review definition rather than
being embedded in the Stream shell. Review, audience, sequence, and feedback
links are built from the configured review slug, so the shared components do
not contain Stream routes.

Lifecycle, deployment status, and audit status are also recorded on every
immutable review version. The displayed version controls its banner and
submission policy: a superseded version can remain readable as `REVIEW_CLOSED`
while the active version accepts feedback, without inheriting the newer
version's deployment or audit claims. Historical pages link back to the current
review, and versioned editorial, source, reference, declaration, and ledger
routes fail closed when that version's lifecycle is not public.

## Feedback Status

Structured feedback is enabled on every editorial and technical reference
page. Editorial pages place the current page's loaded comments and the existing
structured feedback form in one collapsible rail. The rail starts closed until
the reader opens it, appears beside the document when enough width is available,
and becomes a dismissible right-side overlay on narrower layouts instead of
reflowing the review text. An explicit open or closed preference is retained in
the browser. Opening the **Jump to send feedback** link reveals and focuses the
rail when it was closed.

The rail initially reads the most recent 50 messages from the exact
version-specific review discussion and shows entries attached to the current
page. Reviewers can load older feedback in additional 50-message pages or open
the full ledger for cross-page filters and exports. Closing and reopening the
rail preserves an in-progress draft.

Technical-reference feedback uses the same page-scoped projection. The current
Overview accepts page-level feedback without offering its hidden technical
sections; immutable Overview routes retain their section-specific feedback.
Definition, declaration,
function, event, interface, and source comments additionally match their exact
immutable source identity instead of appearing on every page of the same type.

Editorial feedback can target one stable page section. Technical feedback can
target an exact source range. The client computes the selected snippet checksum
before enabling submission; changing the selected code invalidates any existing
preview until the new checksum is ready.

Each submission records the immutable review version, page or section,
category, suspected severity, and any exact code provenance. The category
**Possible exploitable security vulnerability** is intentionally submitted to
the same public pre-deployment review destination: Stream is not live, and
finding those issues before finalization is the purpose of this review.

For Solidity feedback, start and end line fields are the keyboard selection
controls and the source itself is one focusable scroll region. Changing the
range keeps the written draft in place while the new snippet checksum is
computed; preview and posting remain disabled until that exact reference is
ready. **Preview Wave message** sits with the posting action, renders the
formatted Wave Markdown, and moves focus to the preview so it remains visible
outside the scrollable technical-detail fields.

Submitting uses an immutable snapshot of the draft and its attached context.
If the reviewer edits the draft or changes its page, section, or source range
while a post is still in flight, a successful response does not clear the newer
work. The next post receives a fresh submission ID. A successful post uses the
standard app toast; the existing **Open discussion in the Wave** action remains
the single route back to the posted discussion.

The active feedback ledger at `/reviews/6529-stream/feedback` and each
immutable ledger at `/reviews/6529-stream/versions/{version}/feedback` read the
public review discussion, validate structured metadata against the exact
resolved review configuration, and support filtering plus CSV and Markdown
auditor exports. Source-linked entries open the immutable in-site source view
first, with the pinned GitHub source as a secondary link.

Ledger entries are identified and deduplicated by immutable Wave drop ID, not
by the client-supplied submission UUID inside the drop metadata. Metadata for a
50-drop page is hydrated in batches of no more than eight concurrent requests.
If a drop supplies a section ID, that section must appear in the page's explicit
section allow-list; pages without a section allow-list accept no section IDs.
Invalid structured entries are omitted and reported as ledger warnings.
Exclusion details identify the affected Wave drop and the metadata validation
reason. Metadata field order is not significant; the projection validates the
four required unique keys by name.

The form and ledger are reusable public-review modules. Review-specific
configuration supplies the immutable manifest, page and section allowlists,
feedback taxonomy, lifecycle-derived submission capabilities, review slug, and
server-resolved discussion destination.

## Failure and Recovery

- If the review is missing, confirm the hostname and lifecycle configuration;
  personal and lookalike hosts fail closed.
- If a page URL is unknown, use the overview contents rather than guessing a
  slug.
- If an on-page link misses its heading, report the page and heading text; the
  review retries hash scrolling after streamed content mounts, so refreshed and
  directly opened `#heading` URLs should land on the same target as an in-page
  click.
- If the displayed source differs from a code link, stop relying on the page
  and report the mismatch. All review evidence must refer to one source
  snapshot.
- If a technical selection remains in the checksum state or reports an
  integrity failure, do not submit it; reload the exact versioned source page.
- If page comments fail to load, use **Try again** in the rail. The feedback
  form remains available, and the full ledger can be opened separately.
- If no page comments appear while older Wave feedback remains available, use
  **Load more feedback** to continue searching the bounded discussion history.
- If a valid structured entry is omitted from the ledger, open its Wave
  discussion and report the entry link so its metadata can be inspected.

## Related Pages

- [Public Contract Review Platform Specification](../specs/2026-07-26-public-contract-review-platform.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
