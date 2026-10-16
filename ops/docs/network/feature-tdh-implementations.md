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
  the palette's legend under the list), the conformance vectors it passes,
  the newest build first and the daily comparison's build under it, each
  out of that round's own vectors: the Rust core and program B 89 of 89 at
  P26 `f840096` on the validator's development branch (`30bf8f9`, October
  16, 2026); the Python and Rust references 89 of 89 at `f840096`; the Lean
  model the published manifest's count. The daily comparison's builds are
  read from the latest day's file (`implementations.rust.commit` and
  `implementations.python.commit`, shown as `validator@…` and
  `6529chain@…`), with
  their vector count when the build is a known one (`KNOWN_BUILDS` in
  `tdhFacts.ts`) and the build alone otherwise; no daily version is fixed in
  the page. Then its compute time for one day (program B: not measured yet;
  the Lean model's labelled with its build). Language, how it was written,
  where it runs, the commits and the longer conformance and speed notes
  open under one `Details` control at the row's end. An intro says that no
  source is public yet (D116).
  Under the cards, one closed disclosure (`Notes: names, vector counts,
  check counts and times`) holds, one sentence each:
  the naming key (program B is also the TDH code of proof program B, and
  proof program A runs the validators' own code), that the later rounds'
  vectors change no value of a real day, that check counts
  are each runner's own (1,257 in the Python reference and 1,253 in the
  Rust reference for the same 89 vectors, and the Lean model's as its
  proof manifest gives it), what each compute
  time includes (the Rust reference's 0.6 s is computation alone, 2.9 s
  with parsing, and the Rust core's TDH-v1 step took 1.7 s on Linux and
  5.7 s on Windows inside the validator's run of October 15; the Python
  reference's 4.3 s its whole cycle; the Lean
  model's include reading its raw logs) and where whole daily runs are
  timed, and the TypeScript port of How it works is an illustration, not
  an implementation.
- How each was written, with a lineage graph: P26 at the root, the Rust core
  as a copy of the Rust reference, and the old backend replaced at the
  cutover (the arrow labelled so in both drawings); a tree down the page in
  a narrow column, left to right from a 34rem column. Each program is
  marked by a neutral shape (Rust a square, program B a triangle, the
  Python reference a diamond, the Lean model a circle, 6529.io a ring),
  never by a colour the status palette uses; the same marks head the
  verification page's side-by-side table. Every box is sized from its text in the site font. Program
  B was written from the specifications, the vectors and the design record,
  without opening any other implementation's code; the Rust reference's
  last open choice, the edition-floor adapter, is pinned in P53 §11.3.
- Where each runs, and which checks cover it: one matrix, the full width
  of the page, with a column per program and a row per check or use (P26's
  conformance vectors, a whole real day, random and generated inputs, the
  daily comparison, validator signing, 6529.io's published TDH and the
  zero-knowledge proofs). Each cell has an icon and a word: now, planned
  (said in the cell: `First check, planned`), from a date, under test, or
  no, with a legend.
- How they are checked: conformance vectors, differential replays, five
  rounds of differential tests across the Lean model, the Python reference,
  the Rust core and program B (a table, `#difftest-rounds`, gives each
  round's inputs, findings and the P26 round that settled it; E13, from the
  fifth round on October 16, is open for the vector format; the
  Specification and Formal model pages link to it), the dual run in every
  validator (the Rust core against program B before signing, the Python
  reference an optional third check: decided, D125 and P53 §4.5, not yet
  built in), the daily comparison (scheduled daily from 16 October 2026),
  the formal model, and proofs A and B, plus why Rust versus Python is the
  real check after the cutover. Each check is two lines, with the counts
  and the detail under `More`. The matrix above has short notes at prose
  width: in CI, 6529chain's `tdh-formal.yml` runs 1,000
  seeded random inputs through Lean, Python and the Rust reference on every
  change, and the validator's CI runs the Rust core against program B. A
  note under the differential tests says where vectors 75 to 88 came from:
  76 to 79 settle round 4's findings, 75 and 80 to 88 the fifth round's
  rulings on input types.
- Latest daily agreement card with the track record (days equal out of days
  published), hidden when the verification data cannot be loaded or
  reports have not started.
- Inside one vector: vector 36's transfers, each with its age in days
  before the vector's snapshot time T, every cell at one size, and a note
  that decoded timestamps need not rise with the block number (P26 §4.2:
  block 1,003 is stamped before block 1,002); then every expected value:
  for the cycle H, the editions, the rates (in cents), the address with no
  record (W) and the totals, and for the records each identity and each of
  its tokens with balance, raw, base, boost_c and final; which wallet is A,
  W and B, why the values are what they are, and where its boost of 1.08
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
