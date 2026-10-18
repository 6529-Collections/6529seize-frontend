# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH v1.4: what it
reproduces, which properties of the rule are machine-checked proofs, which
claims were shown false with counterexamples, and what the proofs do not
cover. Every status and every count comes from the model's proof manifest
(below), read from the feed at run time. Since October 16, 2026 the feed
serves round 5, the model at commit `6b32f3f` of 6529's design repository
(Lean 4.35.0), beside P26 as of `f840096`; the copy bundled with the page is
that same file. Round 6 (`2694e72`, October 18, 2026), which follows P26
at `3bfa7b0` with D136's four-wallet consolidation, is committed and not yet
published; the builds panel shows it beside the published build. The model's
source is in 6529's private design repository.
A `Proposal, not adopted` pill
and a status line say that P26 stays the rule: it is proposed to the owner
that the model become the normative definition of TDH v1.4, which has not been
decided.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- About contents menu: `TDH formal model` under Network & Reputation
- TDH section navigation: `Formal model`

## Content

- One row of four figures, every one read from the manifest the page
  loaded and each with its unit: theorems proved, counterexamples (with the
  claims they show false: the first netting rule's five cases refute one
  claim, so 11 counterexamples refute 7 claims), limits not proved here,
  and conformance vectors passed out of P26's. The first three carry the
  colour of their outcome (holds, shown false, not covered). Under the
  theorems figure, one line adds the theorems that establish
  counterexamples up to the 85 that PROOFS.md documents and says how many
  proved theorems restate a definition; its details add that the build's
  audit covers every theorem and definition of the model (1,068 theorems
  and 1,538 definitions at round 5). What each counts, and the manifest's
  commit and generation time (24-hour clock), are in one disclosure under
  them.
  A new build changes them by itself; nothing in the page fixes a count the
  manifest gives.
- The builds behind the page, in one panel: the published build (model
  commit and date, Lean version, P26's last change, its vectors and checks,
  theorems and fact checks, where its statuses were read from, when the
  manifest was generated, the link to the manifest JSON and the SHA-256 of
  the file served). Only when the feed serves an earlier round than the one
  the page knows is committed does a second column show that round under a
  `Not yet published` pill (its commit and date, figures, the SHA-256 of its
  committed manifest, which identifies the build, and, in a disclosure,
  what it changes); with round 5 published there is none. The feed's copy
  of a manifest adds `generatedAt`, `source` and `documents`, so its
  SHA-256 never equals the committed file's, and the page says so rather
  than offering the two hashes for matching.
- Why write the rule again (the 23 choices a clean-room implementation had to
  make, two rated high, and the first netting rule the proofs refuted), and
  `Found by the model, by program B and by a review, and settled in the
  specifications`: the first netting rule (found by program B, five cases
  then proved by the model), cases H (the model) and I (a review), F, G,
  the 19.99% cap (six passes where P53
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
- What is proved, and what is not, across the whole width: a legend in
  three colours (holds, shown false, not covered), each listing its
  methods by label and shape (kernel, definition, evaluation that trusts
  the compiler; a kernel or an evaluated counterexample; outside these
  proofs), then one table for TDH v1.4 and one for two validator rules. The
  filters count statements, in the same three groups, and say that the
  figures at the top count manifest entries. Each row has a status
  (`Proved`, `By definition`, `Checked at build`, `Shown false`, `False by
  evaluation`, `Not proved here`, or `Not confirmed` when the manifest
  does not confirm it), and a proved row that bundles a limit PROOFS.md
  leaves open (netting invariance and the canonical sort) says so beside
  its pill. Its references name a document once (`P26 §3.1, 3.2, 6.1`).
  The netting row's claim states the theorem's hypotheses (transfers
  already in canonical order, transactions corresponding one to one), and
  the cap row says which inputs are taken as given. A row opens to its scope, the Lean
  statement and the manifest's entries: each theorem with its status, the
  axioms Lean reports for it, its file and line and the manifest's reading
  of it, each `#guard` case with its number of checks. Lean code keeps its
  lines, and a long line wraps with a hanging indent. The replay row is
  `The replay succeeds on valid input`, with the transaction rules it
  assumes. Four statements of the TDH v1.4 table are shown false, among them that
  steps inside a transaction never matter (counterexamples H and I); that a
  token's balance and raw days stay the same while its eligibility does is
  marked not proved here (it follows from P26 §7.2's definitions); the first
  netting rule's row shows its five counterexamples, each with what its
  values measure (the network total, ZERO's record in case B under the
  first rule, identity {A, B}'s final in case C); held = minted − burned
  is `False by evaluation` (counterexample G is a `#guard`).
- What the model contains, across the whole width: what it covers, its
  runs as a small table (the vectors; the 2026-10-11 cycle from raw logs;
  the random inputs against the Python reference locally and, in CI, 1,000
  seeded random inputs through Lean, the Python reference and the Rust
  reference), one line calling the day and the random inputs evidence by
  evaluation, which trusts Lean's compiler, not proof, what it leaves out
  (since round 4, `f854661`, selecting and decoding logs are definitions of
  the model, checked by vectors and runs, not by a theorem; round 5 adds the
  one-log rule, whose check a theorem proves enough,
  `canonicalTransfers_oneLog`, and the strict reader, test tooling checked
  by vectors only), and its modules by P26 section (`Tdh.Inputs` at round 5:
  §2, §3, §5.2, §6.1). The day's log counts are given both ways: 414,007
  through the snapshot block, of 414,254 in the day's file.
- What the proofs do not guarantee, with a link to the six rounds of
  differential tests on the Implementations page, which lists what each
  round found. The Rust core is checked against the Python reference on
  each day of the daily comparison; the Lean model matched it on one real
  day, the October 11, 2026 cycle.
- Three layers of assurance across the section: the specification, the
  model and the programs as bands, each labelled with its layer, and the
  inputs under them, drawn dashed as partly in place (checked reads, D118,
  are built: every daily run checks the snapshot block's headers and the
  edition floors, while the history before the snapshot is taken as
  reported until the full check runs; proofs A and B, D119, are being
  built). Each check is named on the arrow between the layers it joins,
  with a legend for each border. Its text alternative says that the Rust
  core and the Python reference check each other in the daily comparison,
  and that the Rust core against program B before every validator signs is
  decided (D125) but not built in, with nothing signing today. Then how
  the model is checked (`lake build`, `lake exe tdh-vectors`; it is in
  6529's private design repository), with the published build's figures.

## Rounds of the model

The page knows four rounds of the model and shows the one its manifest
records (`leanRound` in `formalStatus.ts`):

- Round 3 (`7bf579a`, the feed's manifest until October 16, 2026): the model
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
- Round 6 (a manifest that proves `computeCycle_clusters`, 6529chain
  `2694e72`, October 18, 2026): follows P26 at `3bfa7b0`, TDH v1.4 with
  D136's four-wallet consolidation (rule version `tdh-v1.4`). A row `Group
  sizes and the four-wallet gate` rests on the six theorems of PROOFS.md
  section 7 (every identity within `consolidation_max_wallets` and
  pairwise confirmed, a group past the ungated size only with a member
  whose links with all the others are fresh, none past three on a day
  before the activation time) and names its three limits (the greedy order,
  the pair-key order checked by `#guard`, and that the text is 6529.io's
  code); the facts row adds the four-wallet facts; the module table names
  `Tdh.Consolidation` with the times, the pair-key order and the gate; the
  runs are the README's at `2694e72` (about 36 seconds from raw logs,
  1,092,730 random checks; audit 1,156 theorems and 1,576 definitions).

The feed has published round 5's manifest since October 16, 2026, and the
bundled copy is that file (SHA-256 `24e2f16b…`); every count the page shows
is read from the manifest it loads, never written into the page. The
summary splits the counterexamples by how each is checked (a kernel-checked
theorem or an evaluation, #guard) and counts the claims they show false
(`refutedClaimCount`), its details give the
arithmetic of proved and audited theorems, the statements table's filters
count statements (each row says how many manifest entries it groups, and
shows a one-line claim with the plain words behind its chevron), and every
manifest entry is listed by status under the tables, each group with its
unit and colour (`Proved: 78 theorems`, `Counterexamples: 11, against 7
claims`, `Not proved here: 9 limits`). A statement refuted
only by evaluated counterexamples has its own status, `False by
evaluation`; each status has a shape as well as a colour. Every section uses
the heading rail, and `What the proofs do not guarantee` gives each item in
two lines with the rest under `More`. While the feed serves an earlier
round, the builds panel shows round 6 in a column of its own, under a
`Not yet published` pill, with its figures (104 of 104 vectors, 61 + 30
theorems, 54 fact checks) and the SHA-256 of its committed manifest, and
says every status on the page is the published build's; the page switches
to round 6 by itself once the feed publishes its manifest. Round 5's fact-check row lists the facts it adds (an amount's type,
`totalMax`'s, the one-log rule). The Implementations page's Lean card
follows the same switch for its compute time.

The summary counts every proved statement of the TDH v1.4 table, as the
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
  (`lib/tdh/formal/bundledManifest.json`, the published round-5 file, read
  through `bundledManifest.ts`) and says so. Refresh the copy after each new build of the model.
- Each statement (`app/network/tdh/formal/leanResults.ts`) names the manifest
  entries it rests on; its status stands only when the manifest confirms
  every one of them. The plain-English text, the quoted Lean statements and
  the runs the manifest does not repeat (the 2026-10-11 cycle, the random
  inputs) are bundled and change with a reviewed update.
- `__tests__/app/network/tdh/formalStatus.test.ts` checks every round: every
  statement of a round is confirmed by a manifest of that round (round 5's
  from the theorem entries of its committed manifest,
  `__tests__/app/network/tdh/fixtures/roundFiveManifest.json`; round 6's
  from `roundSixManifest.json`, its committed manifest with the feed's
  provenance fields added; round 3's
  from `roundThreeManifest.json`, the feed's earlier file), every
  audited theorem belongs to exactly one statement, and a manifest of an
  earlier round cannot confirm a later round's statements.

## Related Pages

- [TDH v1.4 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
