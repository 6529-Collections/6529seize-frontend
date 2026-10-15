# TDH Implementations

Parent: [Network Index](README.md)

## Overview

`/network/tdh/implementations` shows who computes TDH-v1, how each program
was written and how they are checked against each other: the Rust core every
validator runs, program B, the Python reference, the Lean model and 6529.io's
current backend.

## Location in the Site

- Route: `/network/tdh/implementations`
- Page heading: `Implementations`
- Browser title: `TDH implementations | Network`
- About contents menu: `TDH implementations`
- TDH section navigation: `Implementations`

## Content

- The programs: language, what each was written from, where it runs,
  conformance, compute time (with the daily job's measured run times beside
  it) and source (`Source to be published` until the owner publishes the
  code). A comparison table on desktop, cards on phones; the sources sit in a
  row under the table.
- How each was written, with a lineage diagram.
- Where each runs: validator signing (once validators run), the daily
  comparison (from 16 October 2026), 6529.io (cutover about 23 October 2026)
  and the proof programs (being built).
- How they are checked: conformance vectors, differential replays, the dual
  run in every validator, the daily comparison, the formal model and proofs A
  and B, plus why Rust versus Python is the real check after the cutover. A
  table shows which check covers which program.
- Latest daily agreement card (hidden when the verification data cannot be
  loaded or reports have not started).
- Inside one vector: vector 18's transfers and expected values, and why.
- The 51 conformance vectors, filterable by topic (including `Netting`).

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
