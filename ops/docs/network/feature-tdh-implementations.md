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

- The programs, one comparison under a header row inside its card (the
  Rust core, the Rust reference, program B, the Python reference, the Lean
  model and 6529.io's backend), a row each with no colour on the names, so
  the status pills' colours are the only ones in it: what it is, its status
  as a shared TDH status pill (for example `Runs in the daily comparison`,
  `Built, not in validator` or `Proposal, not adopted`, one line each, with
  the palette's legend under the list), the conformance vectors it passes
  round by round, each out of that round's own vectors (the Rust core: 51
  of 51 at P26 `0621ed4`, the daily job; 75 of 75 at `a4db4ae`, the
  development branch; round 5's 14 new vectors pending; program B the
  same without a daily job; the Lean model 68 of 68 at its published
  build and 89 of 89 in round 5, not yet published), and its compute time
  for one day (program B: not measured yet). Language, how it was written, where it runs,
  the commits and the longer conformance and speed notes open below each
  row. An intro says which source is not public yet and gives a naming
  key: program B is also the TDH code of proof program B, and proof
  program A runs the validators' own code.
  Under the cards, at prose width, one sentence each: the vectors added
  since the fifth round change no value of a real day, what each compute
  time includes (the Rust reference's 0.6 s is computation alone, 2.9 s
  with parsing; the Python reference's 4.3 s its whole cycle; the Lean
  model's include reading its raw logs) and where whole daily runs are
  timed, and the TypeScript port of How it works is an illustration, not
  an implementation.
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
  rounds of differential tests across four programs (a table, `#difftest-rounds`,
  gives each round's inputs, findings and the P26 round that settled it, the
  fourth's on October 16; the Specification and Formal model pages link to
  it), the dual run in every validator (decided, not yet built
  in), the daily comparison (scheduled daily from 16 October 2026), the
  formal model, and proofs A and B, plus why Rust versus Python is the real
  check after the cutover. A table shows which check covers which program,
  with the same icons and legend (the Lean cell is `68 · round 5: 89 ¹`,
  with its footnote), and short notes at prose width; since P26's fifth
  round the Rust reference also runs on the Lean model's random inputs. A
  note under the differential tests says where vectors 75 to 88 came from:
  76 to 79 settle round 4's findings, 75 and 80 to 88 the fifth round's
  rulings on input types.
- Latest daily agreement card with the track record (days equal out of days
  published), hidden when the verification data cannot be loaded or
  reports have not started.
- Inside one vector: vector 36's transfers, each with its age in days
  before the vector's snapshot time T, every cell at one size, the expected
  values with the rates (in cents) as their first row, which wallet is
  A, W and B, why the values are what they are, and where its boost of 1.08
  comes from (three full sets under the vector's one-season registry). Its
  addresses, transactions and tokens are synthetic.
- The 89 conformance vectors (01 to 88 and 12b, as of 6529chain `f840096`),
  with where the set is pinned (its git tree) and how to read a vector file,
  filterable by topic; the first ten show until `Show all` is chosen. The
  intro says the files cannot be downloaded yet.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
