# TDH Zero-Knowledge Proofs

Parent: [Network Index](README.md)

## Overview

`/network/tdh/proofs` is page 5 of the TDH chapter of 6529 Explained, last in
the chapter's Check group after How sure: what a zero-knowledge proof of a
TDH day is, how one is made, why there are two programs, what the result
contract checks before it records a day, and where the work stands.

## Location in the Site

- Route: `/network/tdh/proofs`
- Page name: `Zero-knowledge proofs`
- Browser title: `Zero-knowledge proofs of a TDH day: what is proved so far`
- Chapter bar: the Check group, `5 Zero-knowledge proofs`
- Links in: the hub's "Three things you can check today", the overview's
  How we know, the daily check's closing door, and How sure's
  zero-knowledge rung.

## Content

- The hero: program A's proof of one real day (under the retired
  tdh-v1.0), accepted by mainnet's SP1 verifier in a read-only call, shown
  as half a pair; the pair both programs proved of a test cycle under TDH
  v1.4; the three totals that agree; the limit in the same block (not recorded: the contract needs both
  proofs and is not deployed, D128); and "Show a pair that fails", marked
  Simulated, where the contract stops at its second check.
- 01 What a proof is: the proof's public values decoded word by word, with
  P53 §4.6's encoding beside them; Break it sets program B's own run of the
  same day beside them.
- 02 How a proof is made, 03 Why two (programs A and B, SP1 and RISC Zero),
  04 The contract (its checks in order and the refusals the record names),
  05 What a proof guarantees (failure scenarios and the layer that stops
  each), 06 Where it stands, 07 What you still trust.
- Every number is a fact from `lib/explained/registry/proofFacts.ts` over
  `lib/explained/data/proofs.json`, sourced from the validator's records.
  The page has no live pill: its sources are records, not the daily feed.

## Updating

When program B proves a real day, or a TDH v1.4 pair is proved, update
`proofs.json`, the "not yet" items and the half-pair marks (hero, record
strip, door, programs table).

## Related Pages

- [TDH How Sure (Formal Model)](feature-tdh-formal-model.md)
- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH Implementations and Vectors](feature-tdh-implementations.md)
