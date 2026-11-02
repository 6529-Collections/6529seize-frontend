# TDH How Sure (Formal Model)

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` is page 4 of the TDH chapter of 6529 Explained, "How
sure": what is proved about the TDH rules, how Lean checks it, what is tested
every day, and what is not. It is driven by the Lean proof manifest that
6529's public TDH feed serves (`formal/manifest.json`); every count on the
page is read from it, and a new manifest changes the page by itself.

The feed's manifest today is the one built for TDH v1.4 (the model's round
7). If the feed ever serves a manifest about the rules before decisions D136
(four wallets) and D137 (the name TDH v1.4), a note under the title names
both. If 6529's design record has the model at a newer commit than the
manifest, a note says the counts are the manifest's until the feed serves the
new one.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `What is proved, what is tested, and what is not.`
- Browser title: `How sure: what is proved about TDH | 6529 Explained`
- Chapter bar: `4 How sure`, under Check

## Content

- A scoreboard, once: the claims (one per section of the manifest), the Lean
  theorems with their worked examples, the statements shown false (in Lean's
  kernel or by evaluation) and the limits named, with the manifest's own
  record under it (Lean version, the file's SHA-256, what the audit covers,
  P26's vectors in the manifest).
- 01 Two questions: two ladders, the rule and a day, each with the line where
  today's evidence stops. Proof A's mainnet day and proof B's missing one
  show as a half pair, with a link to the chapter's page on the proofs.
- 02 One claim, to the end: the netting sentence of P26 §7.1 as first
  written, narrowed and as it stands, each quoted with its commit and time,
  the two refutations with their numbers, and how long each stood.
- 03 The claims: one row per section, each with its limit beside it and its
  counts; then the counterexamples by kind.
- 04 In words and in Lean: pick a claim to read its main theorem, in plain
  words beside the statement Lean's kernel checked (the proof left out), with
  a key to reading it, the rules it is about, its file and line at the
  manifest's commit, its axioms and what it does not cover.
- 05 How Lean checks it: what one build establishes, from the manifest's
  record of it: the kernel checks every proof, the axiom audit, the two kinds
  of counterexample (and which trusts Lean's compiler), the vectors the model
  runs, and the record's CI.
- 06 What you still have to trust: the assumption ledger, then every limit
  the manifest names, each in a sentence.
- 07 Check it yourself: the manifest's SHA-256 computed in the reader's
  browser, the commands that print its counts, where to read a theorem, and
  rerunning the proofs, which waits for the model's source. Each step says who
  can repeat it.
- 08 Every statement: every manifest entry in one closed group per section,
  each with its result, Lean name, file and line, what checked it, the
  manifest's sentence in plain words and, for a theorem, its Lean statement
  behind one more disclosure.

## Data

- The manifest comes from the feed, read again every hour; when it cannot be
  read the page shows the copy bundled with the site
  (`lib/tdh/formal/bundledManifest.json`) and says so in How we know.
- Section titles, references, entries and counts come from the manifest; the
  netting history, the counterexamples' numbers and the model's random-input
  count come from `lib/explained/data/reference.json`, each with its source.
- Each theorem's Lean statement comes from `lib/explained/data/lean.json`,
  copied from the model at the manifest's commit by
  `scripts/explained/sync-lean.mjs` (`6529 run explained:sync-lean -- --chain
  <6529chain>`). The page prints a statement only beside a manifest of the
  same commit. After refreshing the bundled manifest, run it again.
- The Lean model's commit in the record snapshot
  (`lib/explained/data/record.json`, synced by
  `scripts/explained/sync-record.mjs`) is compared with the manifest's.
- Old anchors (`#why`, `#layers`, `#featured`, `#statements`, `#not`,
  `#contains`, `#check`) land where their content now is.

## Related Pages

- [TDH v1.4 Specification](feature-tdh-specification.md)
- [TDH Implementations and Vectors](feature-tdh-implementations.md)
- [TDH Glossary](feature-tdh-glossary.md)
