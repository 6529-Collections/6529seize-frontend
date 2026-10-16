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
  model and 6529.io's backend): what it is, its status as a shared TDH
  status pill (for example `Runs in the daily comparison`, `Built; not yet
  inside the validator` or `Proposal, not adopted`, with the palette's
  legend under the cards), language, conformance against P26's 89 vectors
  (which P26 round each version follows; the Rust core and program B pass
  the 75 of the fourth round in the validator's development branch; the
  Lean model's from its proof manifest, plus round 5's 89 of 89 while that
  round's manifest is not published), and compute time (computation only; a
  whole daily run takes 8 to 21 minutes); how it was written and where it
  runs open below. A `Source to be published` pill sits by the heading.
  Under the cards, one sentence each: the vectors added since the fifth
  round change no value of a real day, where whole daily runs are timed,
  and the TypeScript port of How it works is an illustration, not an
  implementation.
- How each was written, with a lineage graph: P26 at the root, the Rust core
  as a copy of the Rust reference, and the old backend replaced at the
  cutover; a tree down the page in a narrow column, left to right from a
  34rem column. Every box is sized from its text in the site font. Program
  B was written from the specifications, the vectors and the design record,
  without opening any other implementation's code; the Rust reference's
  last open choice, the edition-floor adapter, is pinned in P53 §11.3.
- Where each runs: validator signing (once validators run), the daily
  comparison (from 16 October 2026), 6529.io (cutover about 23 October 2026)
  and the proof programs (being built), each date in a caption under the
  table so the headers stay on one line. Each cell has an icon and a word:
  now, planned or from a date, under test, or no, with a legend.
- How they are checked: conformance vectors, differential replays, four
  rounds of differential tests across four programs (a table gives each
  round's inputs, findings and the P26 round that settled it, the fourth's
  on October 16), the dual run in every validator (decided, not yet built
  in), the daily comparison (scheduled daily from 16 October 2026), the
  formal model, and proofs A and B, plus why Rust versus Python is the real
  check after the cutover. A table shows which check covers which program,
  with the same icons and legend; since P26's fifth round the Rust
  reference also runs on the Lean model's random inputs.
- Latest daily agreement card with the track record (days equal out of days
  published), hidden when the verification data cannot be loaded or
  reports have not started.
- Inside one vector: vector 36's transfers and expected values, and why. It
  is synthetic throughout: no real token, wallet or cycle.
- The 89 conformance vectors (01 to 88 and 12b, as of 6529chain `f840096`),
  with where the set is pinned (its git tree) and how to read a vector file,
  filterable by topic; the first ten show until `Show all` is chosen.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
