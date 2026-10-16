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

- The programs, six equal cards in the series colours of the diagrams (the
  Rust core, the Rust reference, program B, the Python reference, the Lean
  model and 6529.io's backend): what it is, its status (for example `Runs in
  the daily comparison` or `Built; not yet inside the validator`), language,
  conformance against P26's 89 vectors (which P26 round each version
  follows; the Lean model's from its proof manifest), and compute time; how it was
  written and where it runs open below. A `Source to be published` pill sits
  by the heading. Under the cards: the daily job's measured run times, and a
  note that the How it works examples run on a TypeScript port of the
  arithmetic that is an illustration, not an implementation.
- How each was written, with a lineage graph: P26 at the root, the Rust core
  as a copy of the Rust reference, and the old backend replaced at the
  cutover; a tree down the page on phones, left to right from `md`.
- Where each runs: validator signing (once validators run), the daily
  comparison (from 16 October 2026), 6529.io (cutover about 23 October 2026)
  and the proof programs (being built). Each cell has an icon and a word:
  now, planned or from a date, under test, or no, with a legend.
- How they are checked: conformance vectors, differential replays, four
  rounds of differential tests across four programs (the fourth's findings
  F8, F9 and E12 open), the dual run in every
  validator (decided, not yet built in), the daily comparison, the formal
  model, and
  proofs A and B, plus why Rust versus Python is the real check after the
  cutover. A table shows which check covers which program, with the same
  icons and legend.
- Latest daily agreement card (hidden when the verification data cannot be
  loaded or reports have not started).
- Inside one vector: vector 18's transfers and expected values, and why.
- The 89 conformance vectors (01 to 88 and 12b, as of 6529chain `f840096`),
  with where the set is pinned (its git tree) and how to read a vector file,
  filterable by topic; the first ten show until `Show all` is chosen.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
