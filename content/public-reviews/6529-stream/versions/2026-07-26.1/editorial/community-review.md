# How to participate in the community review

This is community feedback week for Stream. The objective is to improve the
contract before it is finalized, not to collect endorsements.

The reviewed source is
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786).
The review version is `2026-07-26.1`. Check both values before commenting. A
comment about another commit may still be useful, but it must say which code it
examined.

## Who should comment

This review is for:

- artists deciding whether the workflow and permanent commitments are
  understandable;
- collectors considering long-term ownership, artwork access, and trust;
- Solidity engineers reviewing implementation and composition;
- protocol designers reviewing governance and successor boundaries;
- auditors building hypotheses and test plans;
- frontend, indexing, storage, browser, and infrastructure engineers checking
  external assumptions;
- community members checking whether the explanations match the intended
  values.

You do not need to read Solidity to identify an unclear promise, unfair
workflow, missing recovery case, or authority you would not accept.

## Comment from the page you are reading

Each review page has a feedback box. Submitting there records the page, review
version, and relevant context so other reviewers can find the discussion.

When the page points to generated code, you can attach a specific definition,
function, event, error, or source range. Technical links use stable semantic
keys derived from the pinned source—not a list position that moves when the
generator finds another declaration.

The public discussion is written to the Stream review subwave. It is part of
the review record, not a private support ticket.

## Structured fields

Every submission includes four machine-readable metadata fields:

- `review_schema` — the schema version used to decode the record;
- `type` — the kind of feedback;
- `severity` — the submitter's view of impact;
- `context` — the exact review page, version, and optional code reference.

The visible comment remains ordinary human language. Structured fields make it
possible to filter, export, deduplicate, and hand material to auditors without
asking a model to reconstruct where it came from.

## Feedback types

Choose the closest type:

- **Question** — something is unclear or needs an authoritative answer;
- **Documentation** — the explanation is incomplete, inaccurate, or difficult
  to understand;
- **Artist workflow** — approval, finality, metadata, or preservation does not
  work for an artist's real process;
- **Product or UX** — the interaction, state, or recovery path is confusing;
- **Protocol design** — a role, boundary, invariant, or lifecycle should
  change;
- **Implementation bug** — the Solidity appears not to implement the stated
  behavior;
- **Possible exploitable security vulnerability** — a path may permit theft,
  unauthorized mutation, permanent lock, manipulation, or another security
  failure;
- **Testing or evidence gap** — an important property lacks a reproducible test
  or operational proof;
- **Accessibility or localization** — the review or intended product excludes
  a class of users.

Possible vulnerabilities are welcome in the Wave because this review is in its
validated predeployment state and its configured disclosure policy explicitly
permits public reporting. Finding them now is the purpose of this process.

## Severity

Severity is a starting signal, not a verdict.

- **Critical** — credible loss of all or substantial assets, permanent
  unauthorized artwork change, protocol-wide takeover, or comparable impact;
- **High** — serious asset, authorization, availability, or finality failure
  with a plausible path;
- **Medium** — meaningful failure with narrower impact, stronger preconditions,
  or a practical workaround;
- **Low** — limited impact or defense-in-depth issue;
- **Informational** — clarification, convention, maintainability, or evidence
  improvement;
- **Not assessed** — use when you are unsure.

Do not reduce a useful observation to fit a severity label. Describe the facts
and uncertainty.

## A useful report

A strong report answers as many of these as possible:

1. What did you expect?
2. What does the pinned code or review page do instead?
3. Which collection, token, role, module, or lifecycle state is involved?
4. What must an actor control or do?
5. What is the consequence?
6. Can you reproduce it with a call sequence or test?
7. Is the issue prevented elsewhere?
8. What fix or design alternative should be considered?

Short reports are still welcome. A precise question can reveal a missing
specification.

## Referencing code

Prefer the generated Technical Reference link because it already carries the
review version and semantic declaration key. If you include a GitHub link, pin
it to the exact commit rather than `main`.

For a multi-contract issue, link every important source and describe the order
of calls. Composition failures frequently sit between two modules rather than
inside one function.

## What happens after submission

### IMPLEMENTED FOR THE REVIEW PLATFORM

The public record starts in a deterministic `NEW` state. The site can project
the original structured, top-level report into a review ledger. Replies remain
in the linked Wave discussion and are not projected into the ledger.

`NEW` means the report exists. It does not mean accepted, rejected, confirmed,
or fixed.

### IMPORTANT LIMIT

The initial ledger does not invent authoritative dispositions from free-form
conversation. It shows deterministic `NEW` records and links each one to its
Wave discussion; it does not interpret replies or claim that an issue is
accepted, rejected, confirmed, or fixed. A model may help search or summarize
discussion, but it cannot silently decide whether a vulnerability is valid.

When a future disposition workflow records a resolution, it should include:

- the disposition;
- who made it and under which authority;
- the source commit or decision that resolves it;
- a regression test or other verification where applicable;
- any remaining risk;
- the review version in which the resolution appears.

## Change handling

The contract will change during review. The active review points at one exact
commit. For each new candidate, the release process must:

1. the generator compiles and inventories the new exact Git tree;
2. it validates every declaration against the compiler output;
3. it produces a new immutable review-data bundle;
4. the site retains version-specific routes and source links;
5. new feedback remains attached to the version it examined.

No generated bundle should be overwritten in place. A current page can move to
the newest candidate; history must remain reproducible.

Automated structural diffs and explicit carry-forward dispositions are not part
of this first review release. Until those workflows exist, compare pinned
versions directly and record any carry-forward decision in the Wave.

## The generator is a truth layer, not an audit

The deterministic generator prevents a language model or editor from omitting a
function simply because the contract is large. It compiles the exact source
tree and extracts definitions, functions, events, errors, signatures,
selectors, source ranges, and documentation.

It does not decide whether the code is correct. It can prove that the published
inventory matches the compiler's view of the pinned commit. Human review,
static analysis, testing, and audit still have to explain consequences and find
bad behavior.

## Review categories

The review pages organize feedback around practical areas:

- artist experience and approvals;
- curation and TDH authorization;
- minting and supply;
- fixed-price sales and auctions;
- revenue, splits, and royalties;
- randomness;
- metadata, scripts, and dependencies;
- freezing, preservation, and finality;
- governance, roles, pausing, and successors;
- security, testing, and release evidence;
- documentation, product, accessibility, and localization.

If a comment spans areas, submit it from the primary page and link the other
relevant pages. The ledger can filter by feedback type and source page.

### Authoritative feedback schema for this review version

Every submission uses feedback schema version `1` and exactly four Wave
metadata keys, in this order: `review_schema`, `type`, `severity`, and
`context`. `review_schema` is the literal schema version. `type` and `severity`
must be values from the following allowlists:

- `type`: `question`, `documentation`, `artist-workflow`, `product-or-ux`,
  `protocol-design`, `implementation-bug`,
  `possible-exploitable-security-vulnerability`,
  `testing-or-evidence-gap`, or `accessibility-or-localization`;
- `severity`: `critical`, `high`, `medium`, `low`, `informational`, or
  `not-assessed`.

`context` is canonical JSON containing the submission ID, review ID and
version, page and section identifiers, and any exact documentation or code
reference. Optional properties are omitted rather than filled with placeholder
values. Page identifiers are the IDs in this version's editorial manifest.

The special possible-exploit type remains in the same public Wave while this
validated predeployment disclosure policy is active.

## Public conduct and sensitive information

Be direct about the code and civil toward people. Disagreement about severity
or design is expected.

Do not post:

- private keys, seed phrases, credentials, cookies, or API keys;
- personal information that is not necessary to the report;
- secrets from unrelated systems;
- instructions or data for attacking a live system outside this review;
- copyrighted material that is not needed to establish the issue.

The contract is not live, so a possible exploit in this candidate should be
described publicly here. If the same technique affects another live protocol,
limit the Stream report to Stream and coordinate that separate disclosure
responsibly.

## For auditors

The review should be exportable without scraping prose from rendered pages.
The immutable generated bundle, editorial manifest, Wave metadata, source
commit, and review ledger form the audit-support package.

Auditors should be able to:

- reproduce the compiler inventory;
- enumerate every code-linked report;
- filter by module, declaration, type, severity, and status;
- see reports that cross review versions;
- verify official replies and fix commits;
- distinguish community hypotheses from validated findings;
- recover the exact explanation shown when the comment was submitted.

## Closing the review

At closeout, the team should publish:

- the final candidate commit;
- all review versions and their structural diffs;
- feedback counts by type and disposition;
- unresolved questions and accepted risks;
- linked fix commits and regression evidence;
- audit reports and remediation status when available;
- the deployment-blocker checklist;
- a machine-readable archive.

Closing community feedback does not erase the discussion. It marks the boundary
used to prepare the release candidate.

## Questions for reviewers

1. Are the feedback types and severity choices sufficient?
2. What context should be captured automatically with every code reference?
3. Which official dispositions and authority rules should the ledger support?
4. How should unresolved reports carry forward when the source commit changes?
5. What export format would be most useful to auditors?
6. Which part of this review is still too technical for a non-Solidity reader?
