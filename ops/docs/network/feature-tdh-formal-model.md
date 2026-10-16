# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH-v1: what it
reproduces, which properties of the rule are machine-checked proofs, which
claims were shown false with counterexamples, and what the proofs do not
cover. Every status comes from the model's proof manifest (below); the
copy bundled with the page records the model at commit `7bf579a` of 6529's
design repository (15 October 2026, Lean 4.35.0), beside P26 as last changed
at `1c69528`. The source is not yet published. A `Proposal, not adopted` pill
and a status line say that P26 stays the rule.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- A summary band: properties of TDH-v1 proved (plus two validator rules),
  draft claims disproved, conformance vectors (68 of 68, 1,190 checks, from
  the manifest) and the records of a real day reproduced (all 21,410 of the
  2026-10-11 cycle), with the theorem counts. Below it, where the statuses
  come from: the published manifest (with a link to its JSON) or the copy
  bundled with the page, and the build it records (commit, date, Lean
  version, P26's last change).
- Why write the rule again (the 23 choices a clean-room implementation had to
  make, two rated high, and the first netting rule the proofs refuted).
- One theorem read two ways: netting invariance in plain words with its
  hypotheses, what it means (no holding stack can change), where it stops
  (mint facts read the steps, so eligibility, and with it balances, raw days,
  rates and TDH, can change; the underflow test reads the steps too), a
  figure of two inputs with one net movement, and the Lean statement with the
  definitions it uses.
- What is proved, and what is not: one table for TDH-v1 and one for two
  validator rules. Each row has a status (`Proved`, `By definition`,
  `Checked at build`, `Shown false`, `Not proved here`, or `Not confirmed`
  when the manifest does not confirm it) and opens to its scope, the Lean
  statement and the manifest's entries: each theorem with its status, the
  axioms Lean reports for it and its file and line, each `#guard` case with
  its number of checks. Four draft claims are shown false, among them that
  steps inside a transaction never matter (counterexamples H and I); that a
  token's balance and raw days stay the same while its eligibility does is
  marked not proved here (it follows from P26 §7.2's definitions); the first
  netting rule's row shows its five counterexamples.
- What the model contains: what it covers and what it leaves out, its runs
  (the vectors, the 2026-10-11 cycle from raw logs, the random inputs), and
  its modules by P26 section.
- What the proofs do not guarantee.
- Three layers of assurance, and how anyone will be able to check
  (`lake build`, `lake exe tdh-vectors`) once the source is published.

## Rounds of the model

The page knows two rounds of the model and shows the one its manifest
records (`leanRound` in `formalStatus.ts`):

- Round 3 (the bundled copy, `7bf579a`): the model starts from decoded
  inputs; order independence covers the decoded items, and raw log order is
  marked not covered. While the manifest is of this round, a note under the
  manifest source says that round 4 exists (6529chain `f854661`, October 15,
  2026), what its PROOFS.md adds, and that its manifest is not published yet.
- Round 4 (a manifest that proves `computeCycleFromSource_perm`): the model
  starts from raw `eth_getLogs` entries. Order independence covers raw logs
  too, a row `The model from raw logs` adds the decoded-input special case
  and typed inputs, the netting and identity-sum rows also cite the claims
  PROOFS.md names as not proved (the canonical sort, the identity record's
  `wallets` field), the module table adds `Tdh.Logs`, and the runs are those
  of the README at `f854661` (all 414,254 logs at their types, 56 to 72
  seconds, 1,182,188 random checks). The Implementations page's Lean card
  follows the same switch for its compute time.

## Data

- The proof manifest, `formal/manifest.json` on 6529's public TDH feed
  (`https://d379duzqnomz3w.cloudfront.net`, or `NEXT_PUBLIC_TDH_VERIFICATION_BASE`
  when set).
  6529's design repository writes it with `design/tdh-lean/tools/manifest.py`,
  which builds the model at one commit, runs the vectors and asks Lean for
  every audited theorem's axioms; it is published from there. The page
  rechecks it hourly and accepts only a clean, passing build whose theorems
  use Lean's standard axioms alone.
- When the manifest is not published (403 or 404), cannot be loaded, fails
  validation or the base is misconfigured, the page shows the copy bundled with it
  (`lib/tdh/formal/bundledManifest.ts`, a trimmed copy of the published file)
  and says so. Refresh the copy after each new build of the model.
- Each statement (`app/network/tdh/formal/leanResults.ts`) names the manifest
  entries it rests on; its status stands only when the manifest confirms
  every one of them. The plain-English text, the quoted Lean statements and
  the runs the manifest does not repeat (the 2026-10-11 cycle, the random
  inputs) are bundled and change with a reviewed update.
- `__tests__/app/network/tdh/formalStatus.test.ts` checks both rounds: every
  statement of a round is confirmed by a manifest of that round, every
  audited theorem belongs to exactly one statement, and a round-3 manifest
  cannot confirm round 4's statements.

## Related Pages

- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
