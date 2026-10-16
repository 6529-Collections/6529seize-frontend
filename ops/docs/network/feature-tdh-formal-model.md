# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH-v1: what it
reproduces, which properties of the rule are machine-checked proofs, which
claims were shown false with counterexamples, and what the proofs do not
cover. Every status comes from the model's proof manifest (below); the
copy bundled with the page records the model at commit `7bf579a` of 6529's
design repository (15 October 2026, Lean 4.35.0), beside P26 as last changed
at `1c69528`. The model's source is in 6529's private design repository. A `Proposal, not adopted` pill
and a status line say that P26 stays the rule: it is proposed to the owner
that the model become the normative definition of TDH-v1, which has not been
decided.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- The builds behind the page, in one panel: the published build (model
  commit and date, Lean version, P26's last change, its vectors and checks,
  theorems and fact checks, where its statuses were read from, the link to
  the manifest JSON and the SHA-256 of the file served) and, while a newer
  round is committed but not published, that round in the column beside it
  under a `Not yet published` pill: its commit and date, the P26 round it
  follows, its figures, the SHA-256 of its committed manifest and, in a
  disclosure, what it changes. A line under both says every status and
  count on the page is the published build's. Each build's figures appear
  only there, so no paragraph below mixes two builds.
- Four figure cards, each a number and a one-line label: statements about
  TDH-v1 proved (counted as the table's filter counts them), draft claims
  disproved, conformance vectors passed and records of a real day; what
  each counts (the statements' names, the validator rules the model caught,
  the checks and the P26 commit, the 2026-10-11 cycle) is in one disclosure
  under them, with the theorem counts.
- Why write the rule again (the 23 choices a clean-room implementation had to
  make, two rated high, and the first netting rule the proofs refuted), and
  `Found by the model, and settled in the specifications`: the first
  netting rule, cases H and I, F, G, the 19.99% cap (six passes where P53
  said five, a valid key as part of being live, the level as one floor) and
  the exclusions recomputation finding.
- What the netting theorem proves, and where it stops: netting invariance in
  plain words with its hypotheses (any two transfer sequences, transactions
  corresponding one to one and in order, one registry, both replays with a
  result; P26 applies it to the canonically ordered transfers), its two
  limits (whole transactions added or removed, and the canonical sort, are
  not covered), what it means
  (within those limits no holding stack can change), where it stops
  (mint facts read the steps, so eligibility, and with it balances, raw days,
  rates and TDH, can change; the underflow test reads the steps too), a
  figure of two inputs with one net movement (across the column, under the
  text), and the Lean statement with the definitions it uses. The netting
  row adds that a reordered or inserted round trip changes no stack as long
  as both versions still pass the underflow test.
- What is proved, and what is not: a legend of the proof statuses, each
  with what it rests on (kernel, definition, evaluation that trusts the
  compiler, counterexample, outside these proofs), then one table for
  TDH-v1 and one for two validator rules. Each row has a status (`Proved`,
  `By definition`, `Checked at build`, `Shown false`, `Not proved here`,
  or `Not confirmed` when the manifest does not confirm it); the netting
  row states the theorem's hypotheses in its plain words, and the cap row
  says which inputs are taken as given. A row opens to its scope, the Lean
  statement and the manifest's entries: each theorem with its status, the
  axioms Lean reports for it, its file and line and the manifest's reading
  of it, each `#guard` case with its number of checks. Lean code keeps its
  lines, and a long line wraps with a hanging indent. The replay row is
  `The replay succeeds on valid input`, with the transaction rules it
  assumes. Four draft claims are shown false, among them that
  steps inside a transaction never matter (counterexamples H and I); that a
  token's balance and raw days stay the same while its eligibility does is
  marked not proved here (it follows from P26 §7.2's definitions); the first
  netting rule's row shows its five counterexamples.
- What the model contains, labelled `At the published build` with its
  commit: what it covers and what it leaves out, its runs (the vectors, the
  2026-10-11 cycle from raw logs, the random inputs), and its modules by
  P26 section. The day's log counts are given both ways: 414,007 through
  the snapshot block, of 414,254 in the day's file.
- What the proofs do not guarantee, labelled the same way, with a link to
  the four rounds of differential tests on the Implementations page, which
  lists what each round found.
- Three layers of assurance across the section: the specification, the
  model and the programs as bands, each labelled with its layer, and the
  inputs under them, drawn dashed as partly in place (checked reads, D118,
  are built: every daily run checks the snapshot block's headers and the
  edition floors, while the history before the snapshot is taken as
  reported until the full check runs; proofs A and B, D119, are being
  built). Each check is named on the arrow between the layers it joins,
  with a legend for each border; then how the model is checked (`lake build`, `lake exe
tdh-vectors`; it is in 6529's private design repository), with the
  published build's figures.

## Rounds of the model

The page knows three rounds of the model and shows the one its manifest
records (`leanRound` in `formalStatus.ts`):

- Round 3 (the bundled copy and the feed's manifest, `7bf579a`): the model
  starts from decoded inputs; order independence covers the decoded items,
  and raw log order is marked not covered.
- Round 4 (a manifest that proves `computeCycleFromSource_perm`): the model
  starts from raw `eth_getLogs` entries. Order independence covers raw logs
  too, a row `The model from raw logs` adds the decoded-input special case
  and typed inputs, the netting and identity-sum rows also cite the claims
  PROOFS.md names as not proved (the canonical sort, the identity record's
  `wallets` field), the module table adds `Tdh.Logs`, and the runs are those
  of the README at `f854661` (all 414,254 logs at their types, 56 to 72
  seconds, 1,182,188 random checks).
- Round 5 (a manifest that proves `canonicalTransfers_oneLog`, 6529chain
  `6b32f3f`, October 16, 2026): follows P26's fifth round. The order row
  adds that transfers at one log position share contract, sender and
  recipient, and that the header and claims maps are taken as fixed; the
  runs are the README's at `6b32f3f` (about 20 seconds from raw logs,
  1,127,150 random checks).

While the published manifest records an earlier round than round 5, the
builds panel shows round 5 in a column of its own, under a `Not yet
published` pill, with the figures of its committed manifest (89 of 89
vectors, 1,253 checks; 55 + 30 theorems; 46 fact checks), and says every
status on the page is the published build's. Round 5's fact-check row also
lists the facts it adds (an amount's type, `totalMax`'s, the one-log rule). The Implementations page's Lean card follows the same
switch for its compute time, and adds round 5's vector count.

The summary counts every proved statement of the TDH-v1 table, as the
filter does; its card names last in, first out, a lemma about how the model
stores a stack.

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
- `__tests__/app/network/tdh/formalStatus.test.ts` checks every round: every
  statement of a round is confirmed by a manifest of that round (round 5's
  from the theorem entries of its committed manifest,
  `__tests__/app/network/tdh/fixtures/roundFiveManifest.json`), every
  audited theorem belongs to exactly one statement, and a manifest of an
  earlier round cannot confirm a later round's statements.

## Related Pages

- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
