# TDH v1.4 Specification

Parent: [Network Index](README.md)

## Overview

`/network/tdh/specification` is shelf page S1 of the TDH chapter of 6529
Explained. It restates P26, the TDH v1.4 deterministic specification, in
full: every section in prose at reading size, with the rule's own formulas
and pseudocode beside it. Every number the registry holds is read from the
registry the TDH v1.4 engine computes on, so the page and the engine cannot
disagree.

## Location in the Site

- Route: `/network/tdh/specification`
- Page heading: `The TDH v1.4 specification`
- Browser title: `The TDH v1.4 specification | 6529 Explained`
- Chapter bar: the Shelf menu, `Specification`

## Content

- Contents, and "This version": the rule version, registry hash and rule ID
  (copyable), P26's vector count and commit, and its two true marks: proposed
  as the consensus rule (P26) and live as 6529.io's rules.
- A note on the rules' change of name (D136, D137): tdh-v1.0, with three
  wallets, is retired; while the daily comparison's files still report it,
  the note says so.
- §1 to §13: scope, inputs and the contract table (with the event signatures
  in a disclosure), canonical events, the cutoff and whole days, editions with
  FirstGM's adjustment, rates and seasons, consolidation with D136's
  four-wallet gate, holdings, arithmetic with the half-cent trap, the output
  and its roots, the registry, P26's deviations and legacy issues by ID, and
  conformance with the real day it was checked against.

## Data

- The registry, the deviation and issue IDs and P26's commit come from the
  record snapshot (`lib/explained/data/record.json`); the latest day's rule
  version and roots from the public feed.
- Every old anchor lands: sections and subsections keep their ids (`#s5-2`),
  deviations and issues theirs (`#dev-2`, `#bug-15`), and `#evidence-replay`;
  the rest move (`app/network/tdh/specification/specAnchors.ts`).

## Related Pages

- [TDH Implementations and Vectors](feature-tdh-implementations.md)
- [TDH How Sure](feature-tdh-formal-model.md)
- [TDH Versions and Boosts](feature-tdh-historic-boosts.md)
