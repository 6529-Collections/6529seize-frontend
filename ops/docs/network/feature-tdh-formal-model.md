# TDH How Sure (Formal Model)

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` is page 4 of the TDH chapter of 6529 Explained, "How
sure": what is proved about the TDH rules, what is tested every day, and what
is not. It is driven by the Lean proof manifest that 6529's public TDH feed
serves (`formal/manifest.json`); every count on the page is read from it, and
a new manifest changes the page by itself.

While the served manifest is about the rules before decisions D136 (four
wallets) and D137 (the name TDH v1.4), a note under the title names both and
gives the updated model's own counts from 6529's design record. When the
feed serves the manifest built for TDH v1.4, the note goes away.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `What is proved, what is tested, and what is not.`
- Browser title: `How sure: what is proved about TDH | 6529 Explained`
- Chapter bar: `4 How sure`, under Check

## Content

- A scoreboard, once: the claims (one per section of the manifest), the Lean
  theorems with their distinct statements and worked examples, the
  statements shown false (in Lean's kernel or by evaluation) and the limits
  named, with the manifest's own record under it (Lean version, the file's
  SHA-256, what the audit covers, P26's vectors in the manifest).
- 01 Two questions: two ladders, the rule and a day, each with the line where
  today's evidence stops. Proof A's mainnet day and proof B's missing one
  show as a half pair.
- 02 One claim, to the end: the netting sentence of P26 §7.1 as first
  written, narrowed and as it stands, each quoted with its commit and time,
  the two refutations with their numbers, and how long each stood.
- 03 The claims: one row per section, each with its limit beside it and its
  counts; then the counterexamples by kind.
- 04 What you still have to trust: the assumption ledger, then every limit
  the manifest names, each in a sentence.
- 05 Every statement: every manifest entry in one closed group per section,
  with its Lean name, result, what checked it and its file and line.

## Data

- The manifest comes from the feed, read again every hour; when it cannot be
  read the page shows the copy bundled with the site and says so in How we
  know.
- Section titles, entries and counts come from the manifest; the netting
  history, the counterexamples' numbers and the model's random-input count
  come from `lib/explained/data/reference.json`, each with its source; the
  updated model's counts come from the record snapshot
  (`lib/explained/data/record.json`, synced by
  `scripts/explained/sync-record.mjs`).
- Old anchors (`#why`, `#layers`, `#featured`, `#statements`, `#not`,
  `#contains`, `#check`) land where their content now is.

## Related Pages

- [TDH v1.4 Specification](feature-tdh-specification.md)
- [TDH Implementations and Vectors](feature-tdh-implementations.md)
- [TDH Glossary](feature-tdh-glossary.md)
