# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH-v1: what it
reproduces, which properties of the rule are machine-checked proofs, which
claims were shown false with counterexamples, and what the proofs do not
cover. The results are those recorded with the model at commit `fbc9f34` of
6529's design repository (15 October 2026, Lean 4.35.0); the source is not
yet published.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- A summary band: properties proved, claims shown false, conformance vectors
  (51 of 51, 976 checks) and the records of a real day reproduced (all 21,410
  of the 2026-10-11 cycle).
- Why write the rule again (the 23 ambiguities a clean-room implementation
  found, and the first netting rule the proofs refuted).
- One theorem read two ways: netting invariance in plain words and in Lean.
- What is proved, and what is not: one table for TDH-v1 and one for two
  validator rules. Each row has a status (`Proved`, `Checked at build`,
  `Checked by tests`, `Shown false`) and opens to its scope, the theorem
  names, the file and the Lean statement. The first netting rule's row shows
  its five counterexamples.
- What the model contains: what it covers and what it leaves out (Ethereum
  decoding, state reads, finality), and its modules by P26 section.
- What the proofs do not guarantee.
- Three layers of assurance, and how anyone will be able to check
  (`lake build`, `lake exe tdh-vectors`) once the source is published.

## Data

The statements and results are bundled with the page
(`app/network/tdh/formal/leanResults.ts`) and change only with a reviewed
update against a new build of the model.

## Related Pages

- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
