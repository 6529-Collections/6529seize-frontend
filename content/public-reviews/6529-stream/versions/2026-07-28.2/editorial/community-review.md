# How to participate in the community review

This page explains how to turn a question, design objection, artist concern,
test gap, bug, or possible vulnerability into a public report tied to the exact
Stream code and explanation it examined. The goal is to improve the protocol
before its permanent boundaries are fixed, not to collect endorsements.

## A concrete example

Suppose you are reading the Randomness page and notice that a request can become
stale before enough time has passed.

1. Open the feedback composer on that page.
2. Choose **Protocol design** or **Implementation bug**, depending on what you
   found.
3. Choose an initial severity, or **Not assessed** if you are unsure.
4. Explain what you expected, what the pinned code does, who can trigger it, and
   what happens to the artwork.
5. Attach the exact function from the compiler-generated code index called the
   Technical Reference.
6. Submit the report to the public Stream review discussion.
7. Use the resulting discussion link to add a reproduction, answer questions,
   or point to another affected module.

The site records the review version, page, section, and optional code reference
with the report. A later reader can therefore recover the context without
guessing which candidate or paragraph you meant.

## Why the review record has structure

Stream is a multi-contract system. A useful comment may involve an artist
workflow, an offchain signer, two Solidity modules, a browser assumption, and a
deployment setting at the same time.

The review machinery exists to protect:

- **Context:** a report remains attached to the exact source and explanation it
  examined.
- **History:** a later candidate does not overwrite the earlier review record.
- **Accountability:** an official decision about a report—its disposition—
  identifies who made it and what evidence supports it.
- **Auditability:** reports can be filtered, exported, reproduced, and handed
  to auditors without reconstructing their meaning from an unstructured feed.
- **Open participation:** a non-Solidity reader can report an unclear promise or
  unacceptable authority with the same durable context as a code-linked bug.

Structure does not make a report correct. A `NEW` record is not a confirmed
finding, a severity is not a verdict, and a generated source inventory is not
an audit. Human review and reproducible evidence remain necessary.

## Confirm the source before commenting

The reviewed source is
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786).
The review version is `2026-07-28.2`.

Check both values before submitting. A comment about another commit may still
be useful, but it must say which code it examined.

[Current Implementation and
Readiness](./security-testing-and-known-limitations) is the authoritative
inventory of what the pinned rehearsal connects, what exists only in source,
which accepted targets remain unfinished, and what evidence is still required.

## Who should comment

This review needs different kinds of expertise:

- **Artists** can decide whether approvals, mutation boundaries, preservation,
  recovery, and finality fit a real artistic practice.
- **Collectors** can test whether ownership, artwork access, sale terms, trust,
  and long-term state are understandable.
- **Solidity engineers** can trace authorization, accounting, state changes,
  unexpected re-entry during external calls (reentrancy), repeated use of a
  one-time authorization (replay), and rules that must stay true across
  multiple contracts.
- **Protocol designers** can challenge the permanent Core token-contract
  boundary, modules, governance, pauses, and successors.
- **Auditors and security researchers** can build hypotheses, reproduce
  failures, and identify missing evidence.
- **Frontend and product reviewers** can find cases where the interface might
  cause a person to approve or pay for something different from what the
  contract executes.
- **Storage, browser, metadata, indexing, and infrastructure engineers** can
  test assumptions that Solidity cannot establish.
- **Accessibility and localization reviewers** can identify explanations or
  workflows that exclude people.
- **Community members** can ask whether the architecture matches 6529's values
  and whether its complexity is justified.

You do not need to read Solidity to identify an unclear promise, unfair
workflow, missing recovery case, unacceptable authority, or term that an
ordinary reader would interpret differently.

## Start from the page you are reading

Each review page has a feedback composer. Submitting from that page records the
page and review context automatically.

When a page links to generated code, feedback can reference a contract,
interface, function, event, error, or source range. Technical references use
stable semantic keys derived from the pinned source rather than positions in a
list.

The discussion is written to the Stream review subwave. It is a public part of
the review record, not a private support ticket.

If a report spans several modules, submit it from the page representing the
primary issue and link the other relevant code or pages. Important failures
often occur between two individually reasonable modules.

## Choose the closest feedback type

- **Question** — something is unclear or needs an authoritative answer.
- **Documentation** — an explanation is inaccurate, incomplete, or difficult
  to understand.
- **Artist workflow** — approval, metadata, preservation, sale, recovery, or
  finality does not work for an artist's real process.
- **Product or UX** — an interaction, state, consequence, or recovery path is
  confusing.
- **Protocol design** — a role, boundary, invariant, lifecycle, or permanent
  choice should change.
- **Implementation bug** — the Solidity appears not to implement the stated
  behavior.
- **Possible exploitable security vulnerability** — a path may permit theft,
  unauthorized mutation, permanent lock, manipulation, takeover, or another
  security failure.
- **Testing or evidence gap** — an important property lacks a reproducible test
  or operational proof.
- **Accessibility or localization** — the review or intended product excludes
  a class of users.

Choose the best fit. The report can explain how the issue crosses categories.

## Assess likely impact

Severity is a starting signal, not a final judgment:

- **Critical** — credible loss of all or substantial assets, permanent
  unauthorized artwork change, protocol-wide takeover, or comparable impact.
- **High** — serious asset, authorization, availability, or finality failure
  with a plausible path.
- **Medium** — meaningful failure with narrower impact, stronger preconditions,
  or a practical workaround.
- **Low** — limited impact or a defense-in-depth issue.
- **Informational** — clarification, convention, maintainability, or evidence
  improvement.
- **Not assessed** — use this when the impact is uncertain.

Describe the facts, assumptions, and uncertainty. Reviewers and maintainers can
revise the assessment after reproduction and discussion.

## Write a useful report

Answer as many of these questions as you can:

1. What did you expect?
2. What does the pinned code or review page do instead?
3. Which collection, token, role, module, field, or lifecycle state is involved?
4. What must an actor control or do?
5. What is the likely consequence?
6. Can you reproduce it with a call sequence, transaction, test, or example?
7. Is the issue prevented or reduced elsewhere?
8. Which assumptions remain uncertain?
9. What fix or design alternative should be considered?

Short reports are welcome. A precise question can expose a missing
specification before it becomes a code defect.

For a product or documentation issue, include the wording or screen state that
created the misunderstanding and the conclusion a reasonable reader might
draw. For an artist-workflow issue, describe the actual studio, collaborator,
signing, preservation, or estate process the design fails to serve.

## Reference code precisely

Prefer a generated Technical Reference link because it carries the review
version and semantic declaration identity.

If you use GitHub, link to the exact reviewed commit rather than `main`. For a
cross-contract issue:

- link every important function or definition;
- describe the order of calls;
- identify storage or accounting that crosses the boundary;
- state which steps revert together and which survive;
- include the test, script, or configuration needed to reproduce the path.

A report about an upgrade, successor, pause, or finality bypass should include
every alternate contract function—identified onchain by its four-byte
selector—or module that can reach the same effect.

## The exact structured fields

Each submission carries exactly four machine-readable fields, in this order:

- `review_schema` — schema version used to decode the report;
- `type` — feedback category;
- `severity` — submitter's initial impact assessment;
- `context` — review, version, page, section, submission, and optional code
  references.

The visible comment remains ordinary human language. The fields make reports
filterable, exportable, deduplicable, and traceable.

For review schema version `1`, the allowed values are:

- `type`: `question`, `documentation`, `artist-workflow`, `product-or-ux`,
  `protocol-design`, `implementation-bug`,
  `possible-exploitable-security-vulnerability`,
  `testing-or-evidence-gap`, or `accessibility-or-localization`;
- `severity`: `critical`, `high`, `medium`, `low`, `informational`, or
  `not-assessed`.

`context` is canonical JSON. Optional properties are omitted when they do not
apply rather than filled with placeholder values.

Page identifiers are the IDs in this review version's editorial manifest. The
possible-exploit type remains in the same public review Wave while the
published disclosure policy permits public reporting.

## What happens after submission

Every new top-level structured report enters the ledger in a deterministic
`NEW` state. Replies remain in the linked Wave discussion.

`NEW` means the report exists. It does not mean accepted, rejected, confirmed,
fixed, or assigned a final severity.

The initial ledger does not infer an official disposition from free-form
conversation. A future official resolution should identify:

- disposition;
- person or body making it and their authority;
- source commit or design decision resolving the report;
- regression test or other verification;
- remaining risk;
- review version containing the resolution.

This protects the difference between a community hypothesis, reproduced
finding, accepted design change, and verified fix.

## When the source changes

The active review points to one exact commit. A later candidate receives a new
immutable review-data bundle and version-specific routes. Earlier explanations,
source links, and reports remain available.

For each new candidate, the review system should:

1. compile and inventory the exact new Git tree;
2. validate declarations against compiler output;
3. publish a new immutable bundle;
4. retain the older version and source links;
5. attach new feedback to the version it examined;
6. record which earlier reports still apply, were fixed, or need review again.

Automated structural diffs and formal carry-forward dispositions are not
available in this first review version. Until they are, compare pinned versions
directly and state which code each conclusion examined.

## What the generated reference establishes

The generated Technical Reference compiles the pinned Solidity corpus and
extracts the definitions, functions, events, errors, signatures, selectors,
source ranges, and documentation visible to the compiler.

It establishes that the published inventory corresponds to the pinned source.
It does not establish that:

- implementation matches the intended specification;
- a function is safe when composed with other modules;
- a deployment is initialized correctly;
- an external provider operates reliably;
- an economic or governance assumption is acceptable.

The inventory supports human review, static analysis, tests, and audit. It does
not replace them.

## What remains outside the review machinery

The platform can preserve a report and its context. It cannot:

- decide whether a claim is true merely because it was submitted;
- turn discussion replies into an authoritative resolution;
- guarantee that every affected code path was linked;
- reproduce an external provider or marketplace from a local mock;
- replace independent security audit;
- make an unclear artistic or governance choice acceptable.

That is why strong reports include evidence and why official dispositions must
name their authority and verification.

## What to review

Useful feedback can address:

- artist identity, consent, delegation, recovery, and estates;
- curation, Total Days Held (TDH), authorization construction, signer custody,
  and replay;
- shared collection identity, supply, mint phases, gates, and counters;
- fixed-price sales, auction custody, bids, extensions, refunds, and settlement;
- collaborators, split profiles, curator rewards, accounting, and royalties;
- randomness providers, failures, retries, migration, and reserves;
- metadata modes, scripts, dependencies, encoding, and browser behavior;
- preservation, manifests, Core freeze, and artwork finality;
- roles, pauses, governance binding, guardians, and successors;
- threat model, tests, deployment evidence, and release criteria;
- whether the system is more complex than its requirements justify;
- whether the explanations make that complexity legible.

Do not assume complexity is proof of sophistication or proof of failure. Ask
what each mechanism protects, whether that protection belongs onchain, and
whether a smaller authority or state surface can preserve the same guarantee.

## Public conduct and sensitive information

Be direct about code and design, and civil toward people. Disagreement about
severity, architecture, and permanence is expected.

Do not post:

- private keys, seed phrases, credentials, cookies, or API keys;
- personal information unnecessary to the report;
- secrets from unrelated systems;
- instructions or data for attacking a live system outside this review;
- copyrighted material not needed to establish the issue.

Under this review version's published disclosure policy, a possible exploitable
vulnerability in Stream may be described publicly in the review Wave. If the
same technique affects another live protocol, limit the Stream report to Stream
and coordinate the separate disclosure responsibly.

## For auditors

The review is designed to be exported without scraping meaning from rendered
pages. The immutable generated bundle, editorial manifest, structured Wave
metadata, pinned source, and review ledger form the audit-support package.

Auditors should be able to:

- reproduce the compiler inventory;
- enumerate every code-linked report;
- filter by module, declaration, type, severity, and disposition;
- identify reports that cross review versions;
- distinguish community hypotheses from validated findings;
- verify official replies, source changes, and regression evidence;
- recover the exact explanation shown when a comment was submitted.

Public review can improve the specification, reveal assumptions, and find
important defects. It does not replace independent expert audit of the exact
release candidate and deployment configuration.

## Closing the review

At closeout, the team should publish:

- final candidate commit and Git tree;
- every review version and available structural diff;
- feedback counts by type and disposition;
- unresolved questions and accepted risks;
- fix commits and regression evidence;
- audit reports and remediation status;
- deployment-blocker checklist;
- machine-readable archive of the review record.

Closing feedback marks the boundary used to prepare a release candidate. It
does not erase the discussion or detach a report from the source it examined.

## Questions for reviewers

1. Can an artist or collector identify the right place to comment without
   understanding the contract structure?
2. Are the feedback types and severity choices sufficient?
3. What context should be captured automatically with every code reference?
4. Which official dispositions and authority rules should the ledger support?
5. How should unresolved reports carry forward when the source commit changes?
6. What export format would be most useful to auditors?
7. Which explanation remains too technical for a non-Solidity reader?
8. Does this process invite genuine disagreement about whether Stream's
   complexity is justified?
