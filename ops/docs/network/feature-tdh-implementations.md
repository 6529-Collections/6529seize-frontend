# TDH Implementations and Vectors

Parent: [Network Index](README.md)

## Overview

`/network/tdh/implementations` is shelf page S2 of the TDH chapter of 6529
Explained: the programs that compute TDH, which one runs when, and how to
test an implementation against the vectors and a real day.

## Location in the Site

- Route: `/network/tdh/implementations`
- Page heading: `Implementations and vectors`
- Browser title: `Implementations and vectors: TDH v1.4 | 6529 Explained`
- Chapter bar: the Shelf menu, `Implementations and vectors`

## Content

- 1 The programs: program A (the Rust core) and program B, written
  separately, each also run inside a zero-knowledge prover (proof A in SP1,
  proof B in RISC Zero), and the Python reference, the Rust reference, the
  Lean model and 6529.io, in one table.
- 2 The vectors: P26's count, the count the served Lean manifest checks (each
  labelled), the five public vectors with a download of
  `/network/tdh/public-vectors.json`, and how to run one.
- 3 The roots to aim for: the latest day's pin block (rule version, registry
  hash, rule ID, cutoff block, contracts, cycle and wallet roots, input hash)
  with a Copy button, a link to the day's receipt, and the ask of the owner
  to publish one day's canonical input.
- 4 How they were checked: the differential test rounds and the random
  inputs CI runs on every change to P26.

## Data

- The pin block comes from the feed's latest day file; the vector counts from
  the record snapshot and the manifest; the public vectors from
  `components/explained/engine/publicVectors.ts`.
- Old anchors (`#vectors`, `#difftest-rounds`, `#programs`, a vector's id)
  land on the matching section.

## Related Pages

- [TDH v1.4 Specification](feature-tdh-specification.md)
- [TDH Verification Dashboard](feature-tdh-verification.md)
