# TDH Glossary

Parent: [Network Index](README.md)

## Overview

`/network/tdh/glossary` is shelf page S5 of the TDH chapter of 6529
Explained: every term the chapter uses, with one meaning, its status mark
(Live, Decided, Proposed, Absolute, Tested) and its source.

## Location in the Site

- Route: `/network/tdh/glossary`
- Page heading: `Glossary`
- Browser title: `Glossary: every TDH term | 6529 Explained`
- Chapter bar: the Shelf menu, `Glossary`

## Content

- One table: term, meaning, status, source. The terms run from TDH and its
  parts (edition, rate, boost, seasons, full sets) through time (cycle,
  snapshot block, finalized block) and wallets (identity, consolidation,
  delegation) to the rules and their checks (registry, vectors, roots, the
  daily comparison, classes, Known cause, programs A and B, the validator).
- Every number in a meaning is read from the facts layer: the rate, the
  threshold, the gate's date, the latest cycle, the validator's version.

## Anchors

- Each row's id is a term of the overview's old glossary (`#tdh`, `#cycle`,
  `#firstgm`); a term merged into another keeps its anchor in that row
  (`#sink` in the burn addresses, `#rust` in programs A and B, `#versions` in
  TDH v1.4). `#glossary-<term>` on this page lands on `#<term>`.

## Related Pages

- [TDH v1.4 Specification](feature-tdh-specification.md)
- [TDH How Sure](feature-tdh-formal-model.md)
