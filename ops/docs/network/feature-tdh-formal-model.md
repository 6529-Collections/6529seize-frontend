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
and a status line say that P26 stays the rule.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- A summary band: statements about TDH-v1 proved (counted as the table's
  filter counts them, last in, first out named on the card; plus two
  validator rules), draft claims disproved (the card names the validator
  rule the model also caught), conformance vectors (68 of 68, 1,190 checks,
  from the manifest) and the records of a real day reproduced (all 21,410 of
  the 2026-10-11 cycle, equal to the Python reference's), with the theorem
  counts, captioned with the published build; commits in capitalised
  eyebrows keep their case (`CaseSafe`). While a newer round exists, one
  badge names it (`Round 5 committed: 89 of 89 vectors, 55 + 30 theorems`)
  and links to its section (below); every other figure is the published
  build's. Then where the statuses come from: the published
  manifest (with a link to its JSON) or the copy bundled with the page, and
  the build it records (commit, date, Lean version, P26's last change). The
  header carries one pill, `Proposal, not adopted`.
- Why write the rule again (the 23 choices a clean-room implementation had to
  make, two rated high, and the first netting rule the proofs refuted), and
  `Found by the model, and settled in the specifications`: the first
  netting rule, cases H and I, F, G and the P53 recomputation finding.
- What the netting theorem proves, and where it stops: netting invariance in
  plain words with its hypotheses (two canonically ordered transfer
  sequences, transactions corresponding one to one and in order, one
  registry, both replays with a result), its two limits (whole transactions
  added or removed, and the canonical sort, are not covered), what it means
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
  lines and scrolls sideways on phones. Four draft claims are shown false, among them that
  steps inside a transaction never matter (counterexamples H and I); that a
  token's balance and raw days stay the same while its eligibility does is
  marked not proved here (it follows from P26 §7.2's definitions); the first
  netting rule's row shows its five counterexamples.
- What the model contains, labelled `At the published build` with its
  commit: what it covers and what it leaves out, its runs (the vectors, the
  2026-10-11 cycle from raw logs, the random inputs), and its modules by
  P26 section. While the published build is round 3, a line says that
  round 5 moves log selection and decoding into the model.
- What the proofs do not guarantee, labelled the same way, with a link to
  the four rounds of differential tests on the Implementations page, which
  lists what each round found.
- The next build (while one exists): round 5's figures, what it adds, and
  the SHA-256 of its committed proof manifest, so the one the feed later
  publishes can be matched against it.
- Three layers of assurance as one column (the specification, the model,
  the programs, and the inputs that feed them, the last drawn dashed as
  planned: checked reads and proofs A and B; today the history is taken as
  reported), every connector with its arrowheads in the gap and a legend
  for each border, and how the model is checked (`lake build`, `lake exe
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
header has one quiet line naming round 5 and a section after the body, "The
next build: round 5", under a `Not yet published` pill, shows its figures
from its committed manifest (89 of 89 vectors, 1,253 checks; 55 + 30
theorems; 46 fact checks) and says every status above is the published
build's. The Implementations page's Lean card follows the same
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
