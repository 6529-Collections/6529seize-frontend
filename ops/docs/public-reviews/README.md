# Public Contract Reviews

## Overview

Public Contract Reviews are source-pinned, versioned reading rooms for proposed
6529 contracts. They combine plain-language editorial pages with visible
evidence labels and exact source links so artists, community members, technical
reviewers, and auditors can examine the same candidate before deployment.

The first review covers 6529 Stream. Stream is not deployed, is pre-audit, and
is not presented as final or production-ready.

## Availability

The initial Stream review is enabled only on:

- local development at `localhost` or `127.0.0.1`
- the shared `staging.6529.io` host

It is disabled on production. When disabled:

- the NFT navigation does not show the review
- `/stream` and all editorial, technical-reference, source, declaration-search,
  and feedback-ledger routes return the standard not-found behavior
- review pages are excluded from the production sitemap
- review content is excluded from production server tracing
- review records are omitted from the production help and agent corpora
- generated raw review evidence and editorial content are omitted from the
  packaged site artifact
- future staging discussion destinations are not rendered

Production activation requires a later reviewed configuration change.
The same complete public boundary applies while the review lifecycle is
`DRAFT`, even on an otherwise enabled local or staging host.

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
  Stream currently shows **Public review**, **Not deployed**, and **Pre-audit**
- the review version and a link to the exact source snapshot
- page-level evidence labels
- navigation across the fourteen pages in the current version snapshot
- an on-page contents list generated from the editorial headings
- previous and next page controls
- an evidence-label glossary
- a structured feedback form bound to the immutable displayed review version

The overview also provides reading paths for community members, artists,
technical reviewers, and auditors. The generated technical reference lets
reviewers inspect Solidity files, definitions, functions, events, errors, and
other declarations without leaving the review. Its all-declarations explorer
queries the server with the active text, kind, scope, and location filters and
loads up to 100 matching records at a time, rather than sending the complete
declaration inventory to the browser.

## Evidence Labels

- **Implemented** means the behavior is present in the pinned Solidity source.
- **Tested** means retained automated tests exercise it; this is not a security
  guarantee.
- **Proposed** means a design or specification describes it but the pinned
  implementation does not fully provide it.
- **Open for feedback** identifies an active review decision.
- **Audit pending** means no completed external audit covers the candidate.
- **Deferred** identifies work intentionally outside the current target.
- **Known limitation** identifies a recorded constraint, gap, or unresolved
  risk.

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
packages. The lifecycle gate and environment gate must both permit publication
before any public review surface is available.

Status copy and chips are selected from the review definition rather than
being embedded in the Stream shell. Review, audience, sequence, and feedback
links are built from the configured review slug, so the shared components do
not contain Stream routes.

## Feedback Status

Structured feedback is enabled on every editorial and technical reference
page. Editorial feedback can target one stable page section. Technical
feedback can target an exact source range. The client computes the selected
snippet checksum before enabling submission; changing the selected code
invalidates any existing preview until the new checksum is ready.

Each submission records the immutable review version, page or section,
category, suspected severity, and any exact code provenance. The category
**Possible exploitable security vulnerability** is intentionally submitted to
the same public pre-deployment review destination: Stream is not live, and
finding those issues before finalization is the purpose of this review.

For Solidity feedback, start and end line fields are the keyboard selection
controls and the source itself is one focusable scroll region. Changing the
range keeps the written draft in place while the new snippet checksum is
computed; preview and posting remain disabled until that exact reference is
ready.

Submitting uses an immutable snapshot of the draft and its attached context.
If the reviewer edits the draft or changes its page, section, or source range
while a post is still in flight, a successful response does not clear the newer
work. The next post receives a fresh submission ID.

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

The form and ledger are reusable public-review modules. Review-specific
configuration supplies the immutable manifest, page and section allowlists,
feedback taxonomy, lifecycle-derived submission capabilities, review slug, and
server-resolved discussion destination.

## Failure and Recovery

- If the review is missing on production, that is the intended initial gate.
- If it is missing on staging, confirm the exact hostname is
  `staging.6529.io`; personal and lookalike hosts fail closed.
- If a page URL is unknown, use the overview contents rather than guessing a
  slug.
- If an on-page link misses its heading, report the page and heading text; the
  anchor is derived from the maintained Markdown.
- If the displayed source differs from a code link, stop relying on the page
  and report the mismatch. All review evidence must refer to one source
  snapshot.
- If a technical selection remains in the checksum state or reports an
  integrity failure, do not submit it; reload the exact versioned source page.
- If a valid structured entry is omitted from the ledger, open its Wave
  discussion and report the entry link so its metadata can be inspected.

## Related Pages

- [Public Contract Review Platform Specification](../specs/2026-07-26-public-contract-review-platform.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
