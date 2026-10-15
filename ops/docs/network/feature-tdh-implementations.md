# TDH Implementations

Parent: [Network Index](README.md)

## Overview

`/network/tdh/implementations` shows who computes TDH-v1, how each program
was written and how they are checked against each other: the Rust core the
validators will run (and 6529.io from the cutover), program B, the Python
reference, the Lean model and 6529.io's current backend.

## Location in the Site

- Route: `/network/tdh/implementations`
- Page heading: `Implementations`
- Browser title: `TDH implementations | Network`
- About contents menu: `TDH implementations`
- TDH section navigation: `Implementations`

## Content

- The programs, one card each in the series colours of the diagrams: what
  it is, its status (for example `Runs daily from 16 October` or `Built; not
  yet inside the validator`), language, conformance against P26's 61 vectors
  (with what is merged and what is in review), and compute time; how it was
  written and where it runs open below. A `Source to be published` pill sits
  by the heading. Under the cards: the daily job's measured run times, and a
  note that the How it works examples run on a TypeScript port of the
  arithmetic that is an illustration, not an implementation.
- How each was written, with a lineage diagram.
- Where each runs: validator signing (once validators run), the daily
  comparison (from 16 October 2026), 6529.io (cutover about 23 October 2026)
  and the proof programs (being built). Each cell has an icon and a word:
  now, planned or from a date, under test, or no, with a legend.
- How they are checked: conformance vectors, differential replays, the dual
  run in every validator (decided, not yet built in), the daily comparison,
  the formal model with the differential test across four programs, and
  proofs A and B, plus why Rust versus Python is the real check after the
  cutover. A table shows which check covers which program, with the same
  icons and legend.
- Latest daily agreement card (hidden when the verification data cannot be
  loaded or reports have not started).
- Inside one vector: vector 18's transfers and expected values, and why.
- The 61 conformance vectors (01 to 60 and 12b, as of 6529chain `16d70d0`),
  with where the set is pinned (its git tree) and how to read a vector file,
  filterable by topic; the first ten show until `Show all` is chosen.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
