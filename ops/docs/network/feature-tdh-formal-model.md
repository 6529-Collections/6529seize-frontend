# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH-v1: what it
reproduces, which properties of the rule are machine-checked proofs, which
claims were shown false with counterexamples, and what the proofs do not
cover. The results are those recorded with the model at commit `83d0338` of
6529's design repository (15 October 2026, Lean 4.35.0), which follows P26 as
clarified at `16d70d0`; the source is not yet published. A `Proposal, not
adopted` pill and a status line say that P26 stays the rule.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- A summary band: properties of TDH-v1 proved (plus two validator rules),
  draft claims disproved, conformance vectors (61 of 61, 1,094 checks) and the
  records of a real day reproduced (all 21,410 of the 2026-10-11 cycle), with
  the theorem counts and the build.
- Why write the rule again (the 23 choices a clean-room implementation had to
  make, two rated high, and the first netting rule the proofs refuted).
- One theorem read two ways: netting invariance in plain words with its
  hypotheses, what it means (no stack, balance or raw days can change), where
  it stops (mint counts and the underflow test read the steps), a figure of
  two inputs with one net movement, and the Lean statement with the
  definitions it uses.
- What is proved, and what is not: one table for TDH-v1 and one for two
  validator rules. Each row has a status (`Proved`, `By definition`,
  `Checked at build`, `Shown false`) and opens to its scope, the theorem
  names, the file and the Lean statement. Four draft claims are shown false,
  among them that steps inside a transaction never matter (counterexample H);
  the first netting rule's row shows its five counterexamples.
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
