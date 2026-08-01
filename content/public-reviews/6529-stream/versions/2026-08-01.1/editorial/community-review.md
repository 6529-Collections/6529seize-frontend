# How to participate in the community review

Community review pressure-tests Stream's central claim: its architecture should
produce clear artist consent, durable artwork commitments, safe evolution, and
public accountability.

Contributors improve the protocol before its permanent boundaries are fixed.
A useful contribution can support a design, challenge it, identify an
implementation error, expose an assumption, or explain how an artist or
collector would understand a promise differently.

The reviewed source is
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786).
The review version is `2026-07-30.1`. Check both values before commenting so
the discussion remains attached to the code it examined.

## Who should comment

This review needs different kinds of expertise:

- **Artists** can decide whether approvals, mutation boundaries, preservation,
  recovery, and finality match a real artistic practice.
- **Collectors** can test whether ownership, artwork access, sale terms, trust,
  and long-term state are understandable.
- **Solidity engineers** can trace authorization, accounting, state
  transitions, reentrancy, replay, and cross-contract invariants.
- **Protocol designers** can challenge the permanent Core, module, governance,
  pause, and successor boundaries.
- **Auditors and security researchers** can build hypotheses, reproduce
  failures, and identify missing evidence.
- **Frontend and product reviewers** can find cases where the interface could
  cause a person to approve or pay for something different from what the
  contract will do.
- **Storage, browser, metadata, indexing, and infrastructure engineers** can
  test operational assumptions beyond Solidity.
- **Accessibility and localization reviewers** can identify explanations or
  workflows that exclude people.
- **Community members** can ask whether the stated architecture matches 6529's
  values and which decisions deserve permanence.

Solidity knowledge is optional for identifying an unclear promise, unfair
workflow, missing recovery case, unacceptable authority, or term that means
something different from an ordinary reader.

## Start from the page you are reading

Each review page has a feedback composer. Submitting from that page records the
review version and page context so another reviewer can find the relevant
discussion.

When a page links to generated code, feedback can also reference a specific
contract, interface, function, event, error, or source range. Technical
references use stable semantic keys derived from the pinned source, independent
of positions in a list.

The discussion is written to the Stream review subwave as a public part of the
review record.

If a report spans several modules, submit it from the page that best represents
the primary issue and link the other relevant code or pages. Important failures
often occur between two individually reasonable modules.

## Choose the closest feedback type

The type describes the principal contribution:

- **Question** — something is unclear or needs an authoritative answer.
- **Documentation** — an explanation is inaccurate, incomplete, or difficult
  to understand.
- **Artist workflow** — approval, metadata, preservation, sale, recovery, or
  finality fails an artist's real process.
- **Product or UX** — an interaction, state, consequence, or recovery path is
  confusing.
- **Protocol design** — a role, boundary, invariant, lifecycle, or permanent
  choice should change.
- **Implementation bug** — the Solidity appears to diverge from the stated
  behavior.
- **Possible exploitable security vulnerability** — a path may permit theft,
  unauthorized mutation, permanent lock, manipulation, takeover, or another
  security failure.
- **Testing or evidence gap** — an important property lacks a reproducible test
  or operational proof.
- **Accessibility or localization** — the review or intended product excludes
  a class of users.

Choose the primary fit. The report itself can explain how the issue crosses
categories.

## Assess likely impact

Severity is an initial signal that reviewers can revise:

- **Critical** — credible loss of all or substantial assets, permanent
  unauthorized artwork change, protocol-wide takeover, or comparable impact.
- **High** — serious asset, authorization, availability, or finality failure
  with a plausible path.
- **Medium** — meaningful failure with narrower impact, stronger preconditions,
  or a practical workaround.
- **Low** — limited impact or a defense-in-depth issue.
- **Informational** — clarification, convention, maintainability, or evidence
  improvement.
- **Pending assessment** — use this when the impact is uncertain.

Preserve the precision of an observation when assigning severity. Describe the
facts, assumptions, and uncertainty. Reviewers and maintainers can revise
the assessment after reproduction and discussion.

## Write a useful report

A strong report answers as many of these questions as the submitter can:

1. What did you expect?
2. What result did you observe in the pinned code or review page?
3. Which collection, token, role, module, field, or lifecycle state is
   involved?
4. What must an actor control or do?
5. What is the likely consequence?
6. Can you reproduce it with a call sequence, transaction, test, or example?
7. Which existing controls affect the issue?
8. Which assumptions remain uncertain?
9. What fix should be considered?

Short reports are welcome. A precise question can expose a missing
specification before it becomes a code defect.

For a product or documentation issue, include the wording or screen state that
created the misunderstanding and the conclusion a reasonable reader might draw.
For an artist-workflow issue, describe the actual studio, collaborator,
signing, preservation, or estate process the design fails to serve.

## Reference code precisely

Prefer a generated Technical Reference link because it carries the review
version and semantic declaration identity.

If you use GitHub, link to the exact reviewed commit. For a cross-contract issue:

- link every important function or definition;
- describe the order of calls;
- identify storage or accounting that crosses the boundary;
- state which transaction steps revert together and which survive;
- include the test, script, or configuration needed to reproduce the path.

A report about an upgrade, successor, pause, or finality bypass should include
every alternate selector or module that can reach the same effect.

## The structured review record

Each submission carries four machine-readable metadata fields:

- `review_schema` — the schema version used to decode the report;
- `type` — the feedback category;
- `severity` — the submitter's initial impact assessment;
- `context` — review, version, page, section, submission, and optional code
  references.

The visible comment uses ordinary human language. The structured fields make
reports filterable, exportable, deduplicable, and traceable to the exact page
and code.

For this review version, feedback schema version `1` uses these values:

- `type`: `question`, `documentation`, `artist-workflow`, `product-or-ux`,
  `protocol-design`, `implementation-bug`,
  `possible-exploitable-security-vulnerability`,
  `testing-or-evidence-gap`, or `accessibility-or-localization`;
- `severity`: `critical`, `high`, `medium`, `low`, `informational`, or
  `not-assessed`.

`context` is canonical JSON. Inapplicable optional properties are omitted.

## What happens after submission

Every new top-level structured report enters the review ledger in a
deterministic `NEW` state. Replies remain in the linked Wave discussion.

`NEW` means the report exists and awaits review. Later response updates record
acceptance, rejection, confirmation, remediation, and final severity.

The initial ledger treats free-form conversation as discussion. An official
resolution should identify:

- the response status;
- who made it and under which authority;
- the source commit or design decision that resolves the report;
- a regression test or other verification where applicable;
- any remaining risk;
- the review version in which the resolution appears.

This preserves the difference between a community hypothesis, a reproduced
finding, an accepted design change, and a verified fix.

## When the source changes

The active review points to one exact commit. A later candidate receives a new
immutable review-data bundle and version-specific routes. Earlier explanations,
source links, and reports remain available.

For each new candidate, the review system should:

1. compile and inventory the exact new Git tree;
2. validate declarations against compiler output;
3. publish a new immutable bundle;
4. retain the older version and its source links;
5. attach new feedback to the version it examined;
6. record which earlier reports still apply, were fixed, or need
   re-evaluation.

This first review version uses manual comparison: compare the pinned versions
directly and state which code each conclusion examined.

## What the generated reference establishes

The generated Technical Reference compiles the pinned Solidity corpus and
extracts the definitions, functions, events, errors, signatures, selectors,
source ranges, and documentation visible to the compiler.

It establishes that the published inventory corresponds to the pinned source.
Separate evidence must establish:

- the implementation matches the intended specification;
- a function is safe in composition;
- the deployment is initialized correctly;
- an external provider will operate reliably;
- an economic or governance assumption is acceptable.

The inventory supports and complements human review, static analysis, tests, and
audit.

## What to review

Useful feedback can address:

- artist identity, consent, delegation, recovery, and estates;
- curation, TDH, authorization construction, signer custody, and replay;
- shared collection identity, supply, mint phases, gates, and counters;
- fixed-price sales, auction custody, bids, extensions, refunds, and
  settlement;
- collaborators, split profiles, curator rewards, accounting, and royalties;
- randomness providers, failure states, retries, migration, and reserves;
- metadata modes, scripts, dependencies, encoding, and browser behavior;
- preservation, manifests, Core freeze, and artwork finality;
- who can make changes, which operations can be paused, who can stop a proposed
  change, and how service contracts are replaced;
- threat model, tests, deployment evidence, and release criteria;
- whether the total system is more complex than the requirements justify;
- whether the explanations make that complexity legible.

The best review evaluates complexity against what each mechanism protects,
whether that protection belongs onchain, and whether the same result can be
achieved with a smaller authority or state surface.

## Public conduct and sensitive information

Be direct about code and design, and civil toward people. Disagreement about
severity, architecture, and permanence is expected.

Keep public reports free of:

- private keys, seed phrases, credentials, cookies, or API keys;
- personal information unnecessary to the report;
- secrets from unrelated systems;
- instructions or data for attacking a live system outside this review;
- copyrighted material beyond what is needed to establish the issue.

Under this review version's published disclosure policy, a possible
exploitable vulnerability in Stream may be described publicly in the review
Wave. If the same technique affects another live protocol, limit the Stream
report to Stream and coordinate the separate disclosure responsibly.

## For auditors

The immutable generated bundle, editorial manifest, structured Wave metadata,
pinned source, and review ledger form an exportable audit-support package.

Auditors should be able to:

- reproduce the compiler inventory;
- enumerate every code-linked report;
- filter by module, declaration, type, severity, and response status;
- identify reports that cross review versions;
- distinguish community hypotheses from validated findings;
- verify official replies, source changes, and regression evidence;
- recover the exact explanation shown when a comment was submitted.

Public review can improve the specification, reveal assumptions, and find
important defects. Independent experts must also audit the exact release
candidate and deployment configuration.

## Closing the review

At closeout, the team should publish:

- final candidate commit and Git tree;
- every review version and available structural diff;
- feedback counts by type and response status;
- unresolved questions and accepted risks;
- fix commits and regression evidence;
- audit reports and remediation status;
- deployment-blocker checklist;
- machine-readable archive of the review record.

Closing feedback marks the boundary used to prepare a release candidate while
preserving the discussion and each report's link to the source it examined.

## Questions for reviewers

1. Can an artist or collector easily find the right place to comment?
2. Are the feedback types and severity choices sufficient?
3. What context should be captured automatically with every code reference?
4. Which response labels should the feedback record use, and who may assign
   them?
5. How should unresolved reports carry forward when the source commit changes?
6. What export format would be most useful to auditors?
7. Which explanation remains too technical for a non-Solidity reader?
8. Which parts of Stream need a clearer reason for existing?
