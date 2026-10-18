# TDH Implementations

Parent: [Network Index](README.md)

## Overview

`/network/tdh/implementations` shows who computes TDH v1.4, how each program
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
  out of that round's own vectors: the Rust core and program B 104 of 104
  at P26 `3bfa7b0` in the validator's build `a1463f9` (October 18, 2026,
  not yet on the validator's development branch; the Rust core's
  conformance names the validator's release, 0.1.0, numbered below 1.0,
  D137); the Python and Rust references
  104 of 104 at `3bfa7b0`; the Lean model the published manifest's count,
  with round 6 (`2694e72`, 104 of 104), committed and not yet published,
  beside it. The daily comparison's builds are
  read from the latest day's file (`implementations.rust.commit` and
  `implementations.python.commit`, shown as `validator@…` and
  `6529chain@…`), with
  their vector count when the build is a known one (`KNOWN_BUILDS` in
  `tdhFacts.ts`) and the build alone otherwise; no daily version is fixed in
  the page. Then its compute time for one day (program B: not measured yet;
  the Lean model's labelled with its build). Language, how it was written,
  where it runs, the commits and the longer conformance and speed notes
  open under one `Details` control at the row's end. The header row is in
  sentence case (`Time, one day`); below `lg` each value sits beside a
  short label (`Status`, `Vectors`, `Time`), two columns a line when the
  card is at least 19rem wide (a container query), above it otherwise. An intro says what computes TDH v1.4 (three programs
  written separately, the Rust core ported from the Rust reference, and the
  Lean model), that 6529.io is compared every day with the Rust core and
  the Rust core with the Python reference, and that the Rust core and
  program B are to be published with the validator code (D116) while the
  references and the Lean model are in 6529's private design repository.
  Under the cards, one closed disclosure (`Notes: names, vector counts,
  check counts and times`) holds, one sentence each:
  the naming key (program B is also the TDH code of proof program B, and
  proof program A runs the validators' own code), that the later rounds'
  vectors change no value of a real day, that check counts
  are each runner's own (1,311 in the Python reference and 1,307 in the
  Rust reference for P26's 104 vectors, and the Lean model's published
  build's as its proof manifest gives it, on its own vectors), what each compute
  time includes (the Rust reference's 0.6 s is computation alone, 2.9 s
  with parsing, and the Rust core's TDH step took 1.7 s on Linux and
  5.7 s on Windows inside the validator's run of October 15; the Python
  reference's 4.3 s its whole cycle; the Lean
  model's include reading its raw logs) and where whole daily runs are
  timed, and the TypeScript port of How it works is an illustration, not
  an implementation.
- How each was written, with a lineage graph: P26 at the root, the Rust core
  ported from the Rust reference, and the old backend replaced at the
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
  conformance vectors, a whole real day (one, the October 11, 2026 cycle,
  for the references and the Lean model; each day of the daily comparison
  for the Rust core), random and generated inputs, the
  daily comparison, validator signing, 6529.io's published TDH and the
  zero-knowledge proofs). Each cell has an icon and a word: now, planned
  (said in the cell: `First check, planned`), from a date, under test, or
  no, with a legend.
- How they are checked: conformance vectors, differential replays, six
  rounds of differential tests across the Lean model, the Python reference,
  the Rust core and program B (a table, `#difftest-rounds`, gives each
  round's findings in one line and the P26 round that settled it with the
  findings' codes, the generated inputs in its caption and each round's
  findings in full in a disclosure; each finding was settled in P26 or,
  for E8, an event's default use case, in the vector format and the
  references; E13, from the
  fifth round on October 16, is open for the vector format; the sixth, on
  October 18, ran TDH v1.4 with groups of four and found nothing new; the
  Specification and Formal model pages link to it), the dual run in every
  validator (the Rust core against program B before signing, the Python
  reference an optional third check: decided, D125 and P53 §4.5, not yet
  built in, and the Python reference's own row says the same, with nothing
  signing today), the daily comparison (days compared from October 14, 2026, the
  scheduled job every day since October 16), the formal model, and proofs A
  and B, plus why the Python reference is the independent check of the
  published day after the cutover, program B joining once it runs inside
  validators. Each check is two lines, with the counts and the detail under
  `More`. The matrix above has its notes in one closed disclosure: in CI, 6529chain's `tdh-formal.yml` runs 1,000
  seeded random inputs through Lean, Python and the Rust reference on every
  change, and the validator's CI runs the Rust core against program B. A
  note under the differential tests says where vectors 75 to 103 came
  from: 76 to 79 settle round 4's findings, 75 and 80 to 88 the fifth
  round's rulings on input types, and 89 to 103 D136's four-wallet
  consolidation, which round 6 tested.
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
  addresses, transactions and tokens are synthetic. Under it, a closed
  disclosure restates three more vectors in full, generated from their
  files (`byHandVectors.ts`): 04 (last in, first out), 06 (the age carried
  inside an identity) and 23 (identity sums and their rounding), each with
  its wallets, registry seasons and T, its transfers with their position
  and days before T, its consolidation registrations, H and rates where it
  states them, its expected records and why.
- The 104 conformance vectors (01 to 103 and 12b, as of 6529chain
  `3bfa7b0`), with where the set is pinned (its git tree) and how to read a
  vector file (a decoded delegation event's optional `timestamp` included),
  filterable by topic; the first ten show until `Show all` is chosen. The
  intro says the files cannot be downloaded yet.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH v1.4 Specification](feature-tdh-specification.md)
