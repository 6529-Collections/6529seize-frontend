---
title: Public Contract Review Platform and 6529 Stream Review
version: 0.1
status: draft
created: 2026-07-26
---

# Public Contract Review Platform and 6529 Stream Review

## Executive Summary

6529 will publish a detailed public review of the proposed 6529 Stream smart
contract before the contract is finalized or deployed. The review must work for
artists, collectors, community members, Solidity developers, and professional
auditors without reducing the material to either marketing copy or a raw API
reference.

The product is a reusable public contract review platform. Stream is its first
configured review. Shared frontend components, feedback schemas, source
references, review states, ledgers, and exports must not contain Stream-specific
behavior.

The review has two truth layers:

1. Human-authored editorial pages explain purpose, consequences, trust,
   failure cases, and open decisions.
2. A deterministic generator reads an exact revision of the Solidity repository
   and its checked release artifacts to produce the complete technical
   inventory. An LLM may assist editorial work but is not used to decide which
   contracts, functions, events, errors, or interfaces exist.

Readers can submit structured feedback from any editorial or technical page.
The submission is posted as a public drop to a configured review subwave,
retaining the review version, page, section, and optional exact source
reference. The first Stream review subwave will live under Follow the Wave.

The initial release is staging-only. It must be suitable for a community
demonstration and preserve the architecture needed for a later production
release.

## Problem Statement

Smart-contract projects normally separate information that reviewers need:

- prose documentation is detached from exact code
- contract API references are written for developers rather than artists
- community comments are scattered across chat, social media, and pull requests
- audit findings are recorded in separate private systems
- design decisions and rejected alternatives disappear after implementation
- documentation drifts while the contract continues changing
- the final deployed revision is difficult to compare with the revision that
  people reviewed

Stream is unusually large and its source will continue changing during the
frontend project. A one-time manual or LLM-authored inventory would miss
surfaces and become stale. A static article with a generic comment box would
also lose the exact context of each comment.

6529 needs one public interface that joins explanation, exact source,
community identity, discussion, engineering disposition, and deployment
evidence.

## Product Goals

- Explain Stream in concrete language to readers who do not know Solidity.
- Preserve enough detail for a professional contract reviewer to verify every
  consequential claim.
- Present current behavior, intended behavior, known gaps, and open decisions
  as separate concepts.
- Let readers comment on prose, modules, functions, and exact code lines.
- Post feedback into the existing 6529 social layer rather than a disconnected
  comment database.
- Track the response to every substantive feedback item publicly.
- Make pre-deployment security findings welcome in the public review.
- Give auditors a versioned, exportable record of community findings and design
  decisions.
- Detect contract/documentation drift automatically.
- Reuse the system for future 6529 contract reviews.
- Ship a complete staging experience before any production rollout.

## Non-Goals

- Deploy or modify the Stream smart contracts.
- Present Stream as audited, deployed, final, immutable, or production-ready.
- Replace a formal security audit.
- Ask an LLM to infer the authoritative Solidity surface.
- Build a general-purpose GitHub code browser.
- Duplicate every Wave feature inside the review section.
- Create separate review infrastructure for Stream that cannot support another
  contract.
- Deploy the frontend change to production in this workstream.

## Product Principles

### Public RFC, Not Launch Marketing

Every page must make the review state visible. Copy must say what exists, what
is proposed, what is incomplete, and what the community is being asked to
review.

### Progressive Disclosure Without Omission

An artist should not need to read Solidity. A technical reviewer should not be
forced to trust a simplified summary. Each page starts with consequences and
allows readers to move into exact mechanics and source.

### Named Actors and Exact Verbs

Public copy identifies who may, must, or cannot perform an action. It does not
use unsupported claims such as secure, decentralized, immutable, or permanent
without describing the boundary.

### Generated Inventory, Human Explanation

Generated data answers what is present in the pinned source. Human content
answers why it exists, how it affects people, and what decision remains open.
The UI labels both sources.

### Public Feedback With Durable Context

Every feedback item retains the review, version, page, section, and source
revision that the author saw. Page titles and current branches are not durable
identifiers.

### Review Evidence Survives Closure

When a review closes, the pages, feedback, dispositions, source revision, and
change summary remain readable.

## Audiences and Reading Paths

The primary audience selector provides four paths:

- **Community**: purpose, trust, governance, economics, and open decisions
- **Artist**: submission, consent, collaborators, sale terms, metadata,
  freezing, and preservation
- **Technical**: architecture, state transitions, interfaces, functions,
  events, errors, and source
- **Auditor**: attack surfaces, roles, invariants, known limitations, findings,
  source diff, and exports

The selector changes recommended navigation, not the underlying facts. Pages
remain directly linkable and search-indexable.

## Information Architecture

The Stream instance contains fourteen editorial pages:

1. **Overview** - purpose, review status, source version, and calls to action
2. **Artwork Lifecycle** - selection through mint, sale, randomness, freeze,
   preservation, and finality
3. **For Artists** - files, metadata, consent, collaborators, economics, and
   final approval
4. **Roles and Trust** - every actor, permission, dependency, and trust boundary
5. **Curation and TDH Authorization** - offchain decision and onchain execution
6. **Tokens, Collections, and Minting** - token identity, supply, mint paths,
   batches, burns, and collection lifecycle
7. **Fixed-Price Sales and Auctions** - purchase, custody, bidding, refunds,
   settlement, cancellation, and failure behavior
8. **Revenue, Splits, and Royalties** - primary proceeds, credits, withdrawals,
   split profiles, and ERC-2981
9. **Randomness** - providers, requests, bindings, retries, stale requests,
   burns, and final metadata
10. **Metadata, Scripts, and Dependencies** - offchain/onchain modes, execution,
    escaping, dependency pins, and browser behavior
11. **Freezing, Preservation, and Artwork Finality** - mutable fields,
    manifests, archival evidence, reconstruction, and terminal actions
12. **Governance, Pausing, and Successors** - roles, schedules, action classes,
    emergency controls, replacement, and succession
13. **Security, Testing, and Known Limitations** - invariants, tests, analysis,
    blockers, bytecode limits, audits, and explicit non-guarantees
14. **Community Review** - open questions, all feedback, dispositions, changes,
    exports, and review closeout

The technical reference adds generated routes for:

- contract inventory
- one page per contract
- functions
- events
- custom errors
- interface IDs
- source files and fixed-commit line references
- release checksums and generation provenance

The normal navigation exposes the fourteen editorial pages. Generated reference
routes sit behind Technical Reference and do not crowd the primary menu.

## Routes and Navigation

The reusable platform owns a parameterized review route and configuration
lookup. The Stream public path may remain concise, but it must resolve through
the shared review implementation rather than a Stream-only component tree.

Recommended routes:

```text
/stream
/stream/[page]
/stream/reference
/stream/reference/contracts/[contract]
/stream/feedback
```

The reusable implementation may internally use a route adapter or shared page
factory so future reviews can choose an appropriate public base path without
copying components.

The NFT/collections navigation adds **6529 Stream** after the live collection
links and before utility destinations such as NFT Activity. While review is
open, the item carries a visible **Review** status treatment where the menu
format supports it.

The route must provide app-consistent metadata, social sharing metadata, sitemap
coverage, canonical paths, and Help Bot records.

## Review Definition

Each review instance is declared by validated configuration:

```ts
interface PublicReviewDefinition {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly status: PublicReviewStatus;
  readonly version: string;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly source: PublicReviewSource;
  readonly discussion: PublicReviewDiscussion;
  readonly enabledEnvironments: readonly PublicReviewEnvironment[];
  readonly audiences: readonly PublicReviewAudience[];
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly feedbackCategories: readonly PublicReviewFeedbackCategory[];
  readonly severityOptions: readonly PublicReviewSeverity[];
}
```

No shared component may branch on `review.id === "6529-stream"`. Instance
differences belong in configuration, content, generated data, and explicit
extension slots.

Configuration validation fails for:

- duplicate review, page, or section identifiers
- unstable or malformed source revisions
- mutable source references such as `main`
- missing discussion destination in an open review
- an enabled environment without an environment-specific discussion destination
- duplicate feedback metadata keys
- invalid dates or lifecycle transitions
- missing canonical routes
- generated-data/review-version mismatch

## Review Lifecycle

Supported states:

1. `DRAFT`
2. `SCHEDULED`
3. `PUBLIC_REVIEW`
4. `REVIEW_CLOSED`
5. `REMEDIATION`
6. `AUDIT`
7. `FINAL_CANDIDATE`
8. `DEPLOYED`
9. `ARCHIVED`

The current state controls:

- status banner and explanatory copy
- whether new feedback may be submitted
- the source revision shown
- whether security findings are public or use the configured post-deployment
  disclosure policy
- which comparisons and deployment evidence are available

Historical review versions remain addressable after the active version changes.

## Environment Activation

Merging the implementation does not authorize production exposure. Each review
definition declares the environments where its routes and navigation are
enabled. The initial Stream definition enables local development and staging
only.

In a disabled environment:

- Stream is absent from navigation and search surfaces
- review routes return the repository-standard not-found behavior
- feedback submission cannot be invoked
- staging Wave identifiers are never rendered into production HTML

Production activation is a later explicit configuration change with its own
review and deployment authorization.

## Page Content Contract

Each module explanation follows a consistent structure:

1. What it does
2. Why it exists
3. Who may act
4. How it works
5. What becomes permanent
6. What may still change, and who can change it
7. Failure and recovery behavior
8. Technical verification
9. Open questions
10. Feedback entry point

Every behavioral claim may carry one or more visible evidence states:

- `IMPLEMENTED`
- `TESTED`
- `PROPOSED`
- `OPEN_FOR_FEEDBACK`
- `AUDIT_PENDING`
- `DEFERRED`
- `KNOWN_LIMITATION`

Evidence states are not decorative. They must come from explicit content or
generated metadata and have accessible text.

## Deterministic Solidity Technical Reference

### Source Pinning

Every generated reference bundle binds:

- repository owner and name
- full 40-character Git commit
- source tree identity
- compiler/toolchain identity when available
- release artifact schema versions
- SHA-256 of every consumed input
- generator version
- generated output checksum

The public site never labels a branch name as the reviewed source. Links use
GitHub commit permalinks.

### Authoritative Inputs

The generator consumes the exact Stream revision and prefers existing checked
release artifacts for semantic compiler output, including:

- protocol surface report
- release manifest and artifact manifest
- ABI checksums
- event topic catalog
- custom error catalog
- interface IDs
- source verification inputs
- governance catalog where included in the reviewed release
- release blockers and readiness evidence

Solidity source is also read for source paths, line ranges, declarations,
inheritance, modifiers, NatSpec, constants, structs, enums, and source excerpts.

If required release artifacts are absent or inconsistent with source, generation
fails. It does not silently fall back to a partial inventory.

The production contract catalog is not treated as the complete source universe.
The generator enumerates every top-level contract, abstract contract, interface,
and library in the pinned Solidity source closure, then classifies each record
as:

- production release contract
- published interface
- production support library
- deployment or operational source
- test or harness source
- vendored dependency
- excluded source with an explicit reason

The existing production catalog and protocol surface report define the intended
release set, while exhaustive source enumeration proves which definitions sit
outside it. A newly added Solidity module cannot disappear merely because a
manual release catalog was not updated.

### Generated Bundle

The frontend checks in a normalized bundle so application builds are offline
and reproducible. The generator may fetch or read a local exact checkout during
development, but runtime and ordinary production builds do not depend on
GitHub availability.

Recommended shape:

```ts
interface ContractReviewBundle {
  readonly schemaVersion: number;
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly source: {
    readonly repository: string;
    readonly commit: string;
    readonly tree: string;
    readonly sourceChecksums: Readonly<Record<string, string>>;
    readonly artifactChecksums: Readonly<Record<string, string>>;
  };
  readonly generator: {
    readonly name: string;
    readonly version: string;
    readonly outputSha256: string;
  };
  readonly summary: ContractSurfaceSummary;
  readonly contracts: readonly ContractReference[];
  readonly files: readonly SourceFileReference[];
  readonly warnings: readonly GenerationWarning[];
}
```

Each contract reference includes:

- stable identifier and contract name
- source path and declaration line range
- contract, interface, library, or abstract classification
- inheritance
- NatSpec
- bytecode size and checksums when applicable
- functions with canonical signature, selector, visibility, mutability, inputs,
  outputs, modifiers, NatSpec, and line range
- events with topic, indexed fields, NatSpec, and line range
- errors with selector, fields, NatSpec, and line range
- structs, enums, constants, and public state getters
- implemented interfaces and IDs where available
- links to immutable GitHub source

The bundle also includes a complete top-level-definition index. Release-facing
pages may default to production contracts and published interfaces, but the
technical reference exposes the excluded and support classifications so
reviewers can inspect the full source boundary.

### Completeness Gates

Generation fails when:

- the configured commit is not exact
- the repository tree differs from the pinned revision
- an expected production contract disappears without an explicit manifest
  change
- a top-level Solidity definition is absent from the exhaustive source index
- a source definition has no explicit release/support/test/vendor/excluded
  classification
- ABI totals disagree with the protocol surface report
- event or error catalogs disagree with the ABI surface
- a public/external function lacks a generated record
- a generated source line falls outside its source file
- two records share an identifier or selector unexpectedly
- an input or output checksum drifts in `--check` mode

The generator emits warnings for incomplete NatSpec or unavailable
non-authoritative editorial fields, but missing technical surface is an error.

### Contract Changes During Review Development

The source manifest is the only place that advances the Stream commit. Updating
it requires:

1. select the new full contract commit
2. regenerate the bundle
3. review the generated diff
4. update editorial claims affected by the diff
5. run drift, content-link, and route tests
6. increment the public review version when the reviewed contract changes

CI runs the generator in `--check` mode. A source pin cannot change without the
corresponding generated and editorial update.

## Feedback Experience

Every editorial and technical page includes a reusable feedback panel:

### Help Review This Part

Readers choose:

- General comment
- Ask a question
- Suggest a change
- Report a documentation problem
- Report a potential security issue
- Comment on code

The default form asks only for the comment. Technical fields appear when
relevant.

Optional visible fields:

- why this matters
- suggested change
- suspected severity
- preconditions
- expected behavior
- observed behavior
- reproduction or proof-of-concept description

The form automatically attaches context. The user previews the exact public
drop before signing or posting.

### Text and Code References

Readers can:

- comment on the current page
- comment on a stable section
- select explanatory text and quote it
- select source lines from a generated contract page
- open the exact GitHub commit and lines

Code references include repository, commit, path, contract, function when
known, and inclusive line range. Line references are never built against a
moving branch.

### Public Pre-Deployment Security Review

While the review status is pre-deployment, potential security vulnerabilities
are public feedback. The form explicitly invites exact exploit and failure
descriptions because no live Stream deployment or funds are at risk.

After deployment, a review instance may configure a different responsible
disclosure destination. That later policy must not alter or hide historical
pre-deployment feedback.

## Wave Integration

### Destination

Stream feedback posts to one configured subwave beneath Follow the Wave. The
review uses one subwave rather than one subwave per page. Stable metadata and
page filters provide organization without fragmenting discussion.

Staging and production discussion destinations are environment-specific.
Staging work must not create or post to the production review subwave.

### Submission Record

Every feedback drop contains readable Markdown and structured metadata.

Stable metadata fields:

```text
review.schema_version
review.id
review.version
review.feedback_type
review.page_id
review.section_id
review.source_repository
review.source_commit
review.source_path
review.source_contract
review.source_function
review.source_line_start
review.source_line_end
review.suspected_severity
```

Optional values are omitted rather than populated with placeholder text.
Metadata names and value limits must be validated against the live Wave API.
If Wave metadata limits require compact keys, the schema owns a versioned
mapping rather than scattering abbreviations through components.

The drop body remains understandable without metadata rendering. It includes
the feedback type, comment, optional reasoning/change, and links back to the
exact review and source.

### Authentication and Eligibility

The panel displays:

- connect/profile action when unauthenticated
- eligibility explanation when the configured subwave does not allow the
  viewer to post
- review-closed state when submissions have ended
- recoverable error with the draft preserved
- success state linking directly to the created drop

The implementation reuses the existing wallet/profile authentication,
signature, Wave eligibility, submission, toast, cache, and drop-link behavior.
It does not introduce a second authentication or signing system.

### Review Ledger

The Community Review page reads structured review drops and provides:

- stable feedback identifier
- category
- page/module
- source reference
- author
- created time
- suspected severity
- current disposition
- team response
- implementation commit when accepted
- direct link to the Wave discussion

Filters include category, page, contract, severity, disposition, and text
search. Reaction count may indicate attention but never determines technical
severity.

### Dispositions

Official dispositions reference the original feedback drop:

- `NEW`
- `NEEDS_CLARIFICATION`
- `UNDER_REVIEW`
- `ACCEPTED`
- `ACCEPTED_WITH_MODIFICATION`
- `ANSWERED`
- `NOT_ACCEPTED`
- `DEFERRED`
- `IMPLEMENTED`

A disposition records status, response, reason, optional implementation commit,
actor, and time. It may be represented by a structured official Wave response
or a generic review API projection, but the Wave discussion remains the public
record.

The initial staging release may display `NEW` plus official threaded responses
if mutable/indexed disposition support is not yet available. It must not fake
workflow states that cannot be persisted.

## Exports and Auditor Support

The Community Review page exports:

- JSON with full structured context
- CSV for triage
- Markdown with readable feedback and source links

Exports state the review version and source commit and include unresolved,
accepted, rejected, deferred, and implemented items. They exclude private
credentials, authentication material, and frontend-local information.

An auditor package should answer:

- which exact source was reviewed
- what changed after review opened
- which areas generated disagreement
- what trust assumptions were accepted
- which findings remain unresolved
- which feedback produced code changes
- whether public explanations match the final candidate

## UI and Interaction Design

The experience must feel like a dense 6529 product surface rather than a
marketing microsite:

- dark-first `iron-*` surfaces
- restrained borders and status treatments
- compact sticky review status
- readable long-form typography
- persistent desktop table of contents
- compact mobile page/section navigation
- clear editorial/generated labels
- code blocks with line numbers and copy/open/comment actions
- visible loading, empty, error, closed, and success states

The overview may establish identity with typography and system diagrams, but it
does not use decorative gradients, oversized slogans, or unsupported claims.

## Accessibility

The implementation targets WCAG 2.2 AA:

- semantic page landmarks and heading hierarchy
- keyboard-operable page navigation, filters, feedback controls, dialogs, and
  code-line selection
- visible focus
- labels, descriptions, errors, and recovery text bound to form controls
- status updates announced when feedback is submitted
- touch targets appropriate for mobile
- contrast that does not rely on status color alone
- reduced-motion behavior
- readable content at 200% zoom without horizontal page overflow
- a non-drag, non-pointer-only way to reference code lines

Code selection must permit keyboard entry of start/end lines or an equivalent
accessible interaction.

## Localization

The reusable interface, controls, statuses, form labels, validation, empty
states, and accessible names use the existing message system. `en-US` is the
source locale with normal fallback behavior for currently incomplete locales.

Stream’s long-form contract explanation may launch in English for the first
staging review. The content layer must identify its locale and must not embed UI
controls inside untranslated prose.

Dates, times, counts, percentages, currency values, and sorting use repository
locale helpers.

## Content Integrity

Editorial content must:

- identify current implementation versus target design
- disclose that TDH calculation and voting occur offchain
- distinguish one-token-per-authorization behavior from contract-wide supply
  capability
- explain pull-payment accounting
- explain callback, custody, randomness, and freeze ordering
- distinguish current revenue and royalty behavior from unwired target systems
- state the trust and governance powers that exist at the reviewed revision
- state audit, blocker, and bytecode-size status without implying readiness
- call out confirmed code/documentation disagreements as open review items

Content checks ensure every contract, function, and section link resolves to the
same generated bundle. Editorial pages may group technical records but cannot
invent or override selectors, signatures, source lines, or checksums.

## Frontend Architecture

Recommended ownership:

```text
app/<review-base>/                       route adapter and metadata
components/public-review/               reusable UI
config/public-reviews/                   validated review definitions
content/public-reviews/                  editorial content
services/api/public-review/              Wave feedback and ledger reads
scripts/public-review/                   source generation and drift checks
generated/public-reviews/                checked normalized technical bundles
__tests__/public-review/                 schema, generator, route, and UI tests
ops/docs/public-reviews/                  user-facing behavior documentation
```

The final paths should match nearby repository conventions discovered during
implementation. Generated outputs are never edited manually.

Server Components own static review definitions, editorial content, metadata,
and generated technical data. Client Components are limited to interactive
navigation, code selection, filters, and the feedback composer.

## Backend and API Boundary

The initial implementation should reuse existing Wave reads and drop creation
where the current API supports the required behavior.

Backend work is required only if frontend evidence proves one of these is
missing:

- querying review drops by structured metadata at usable scale
- persisting official dispositions
- environment-safe review destination resolution
- returning enough created-drop identity for a success deep link

Any required backend change must use a separate coupled PR and declare its
deployment dependency before staging. The frontend must not silently simulate a
persisted ledger with browser-local state.

## Documentation and Help

The feature adds:

- user-facing review documentation under `ops/docs`
- Help Bot records for Stream, community review, feedback submission, source
  references, and review statuses
- generated help and agent artifacts kept in sync
- direct explanations of authentication, eligibility, draft recovery, closed
  review, and feedback visibility

## Delivery Plan

### PR 0: Specification

- product, architecture, generation, feedback, accessibility, and delivery
  contract
- independent architecture, Wave, Solidity-generation, and product reviews
- available repository review bots and CI

This PR is merged before implementation PRs.

### PR 1: Deterministic Reference Foundation

- review/source schemas
- Stream input manifest
- generator
- normalized generated bundle
- checksums and `--check` drift validation
- generator tests

### PR 2: Reusable Review Shell

- shared routes/page factory
- status banner, page navigation, audience paths, content layout
- metadata, navigation, responsive states, and base accessibility
- overview and lifecycle rendering

### PR 3: Feedback-to-Wave Bridge

- configured Wave lookup
- structured feedback composer
- page/section/code context
- auth, eligibility, preview, preserved draft, error, and success behavior
- direct created-drop link

### PR 4: Technical Reference and Review Ledger

- contract/reference pages
- code-line references
- feedback aggregation, filters, dispositions supported by current persistence,
  and exports

### PR 5: Stream Editorial Corpus

- fourteen complete editorial pages
- diagrams, examples, open questions, limitations, and evidence labels
- links to generated truth

### PR 6: Integration, Documentation, and Staging Evidence

- Help Bot corpus and generated agent files
- user-facing docs
- integrated tests and browser evidence
- current Stream source refresh
- full build and staging candidate

PR boundaries may be combined when implementation evidence shows a smaller
coherent change is safer, but the generator, shared shell, feedback bridge,
technical reference, and Stream content remain independently reviewable
features.

## Validation

Every code-bearing PR runs the focused checks appropriate to its surface.
The integrated candidate requires:

- deterministic generator tests
- generator `--check`
- schema and configuration tests
- route and metadata tests
- feedback payload and failure-recovery tests
- technical reference completeness tests
- ledger filter/export tests
- `seize run lint:changed`
- `seize run typecheck:changed`
- `seize run react-doctor:diff`
- `seize run check:changed`
- targeted Jest tests
- full `seize run build`
- desktop and mobile browser review
- keyboard-only form and navigation pass
- visible screenshot evidence
- no new relevant console/runtime errors
- Help Bot and docs link validation

Staging deployment uses Simple Release Bus v2 with the exact current candidate
SHA. `STAGING_DEPLOYED` is not accepted as completion; the workstream waits for
manifest-bound staging validation and performs a final visible smoke review.

## Acceptance Criteria

- 6529 Stream appears in the intended NFT/collections navigation.
- Stream routes and navigation are enabled locally and on staging but remain
  unavailable in production until a later explicit activation.
- The section is visibly a community review, not a live collection or deployed
  contract.
- Four audience paths and all fourteen editorial destinations are available.
- The technical reference is generated from and pinned to an exact Stream
  commit.
- Generated inventory covers every contract and ABI surface declared by the
  reviewed release artifacts.
- A source change causes the drift check to fail until regenerated.
- Shared components contain no Stream-specific behavior.
- Every page can open a structured feedback form.
- Feedback posts to the configured staging Stream review subwave with durable
  page/source context.
- Potential pre-deployment security findings can be posted publicly.
- Failed submissions preserve the user’s draft and context.
- Successful submissions link to the exact Wave drop.
- The review ledger can filter and export the feedback that the current API can
  persist and query.
- Content distinguishes implemented, tested, proposed, open, deferred, and
  known-limitation claims.
- The experience is usable on desktop and mobile with keyboard-accessible
  navigation and forms.
- User-facing docs and Help Bot records describe the new behavior.
- All feature PRs are agent-reviewed, bot-reviewed, and merged or included in
  the exact staging candidate.
- The exact integrated revision is deployed and validated on staging only.

## Resolved Product Decisions

- Stream is the first instance of a reusable review platform.
- The review uses one subwave and structured metadata rather than one subwave
  per page.
- Pre-deployment security findings are public.
- Technical inventory is generated deterministically, not inferred by an LLM.
- Generated and editorial content are separate truth layers.
- The public experience exposes approximately fourteen editorial pages plus
  generated technical reference pages.
- The initial deployment target is staging only.

## Remaining Configuration Inputs

These values are resolved from current repository and environment evidence
during implementation and do not block the specification:

- final Stream review source commit for the staging demonstration
- staging Follow the Wave parent and Stream review subwave identifiers
- public review open/close timestamps
- final short public route if a route other than `/stream` is preferred
