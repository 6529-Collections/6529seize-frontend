# TDH Implementations

Parent: [Network Index](README.md)

## Overview

`/network/tdh/implementations` shows who computes TDH-v1, how each program
was written and how they are checked against each other: the Rust core every
validator runs, program B, the Python reference and 6529.io's current backend.

## Location in the Site

- Route: `/network/tdh/implementations`
- Page heading: `Implementations`
- Browser title: `TDH implementations | Network`
- TDH section navigation: `Implementations`

## Content

- The programs: language, what each was written from, where it runs,
  conformance, speed and source (`Source to be published` until the owner
  publishes the validator code). A comparison table on desktop, cards on
  phones.
- How each was written, with a lineage diagram.
- Where each runs: validator signing, the daily comparison, 6529.io and the
  proof programs.
- How they are checked: conformance vectors, differential replays, the dual
  run in every validator, the daily comparison and proofs A and B, plus why
  Rust versus Python is the real check after the cutover.
- Latest daily agreement card (hidden when the verification data cannot be
  loaded or reports have not started).
- The 36 conformance vectors, filterable by topic.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
