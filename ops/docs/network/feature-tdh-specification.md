# TDH-v1 Specification

Parent: [Network Index](README.md)

## Overview

`/network/tdh/specification` restates specification P26 (TDH-v1, rule
version `tdh-v1.0`, at commit `f840096`, its latest change, October 16, 2026)
section by section: each section in plain words beside the rule, either quoted
(`Exact rule`) or P26's prose rules line for line (`Exact rule, restated
line by line`): log selection and positions, decoding, mints and sinks, header order,
delegation events, identities, records, totals, the numeric range and the
registry's constraints. It opens with a
map of how the sections feed each other (from `md` up; phones go straight to
the sections) and a symbol table, and lists the parameter registry and its
hash, the 19 deviations from the old backend with their decisions, the 15
old-backend issues, the decisions the TDH pages cite, the evidence and the
changes since 15 October. The header carries the rule version, a
`Proposal, not adopted` pill and P26's SHA-256, shortened with a copy
button, beside the version line, then one closed `Version` disclosure
(`Version: tdh-v1.0, specification P26 at f840096, October 16, 2026`): the
rule version (not frozen until launch), the text (P26 at `f840096`), the
SHA-256 of P26's file with a copy button, so the text it restates can be
matched against the file later, where it is (P26, its vectors and the Lean
model in 6529's private design repository; the validator source, with a
copy of the vectors, to be published when the owner decides, D116) and its
status. Chips that cite P53, P38, P52 or P28
name their document and say it is in 6529's private design repository.

Reference material is collapsed so the rules carry the page: each section's
source chips sit in one closed `Sources (n)` disclosure at its end, and the
symbol table, the event-contract table, the floor read of P53 §11.3, the
pair-state drawing, the cycle root and its trees, the registry table and
its hash, the deviation and issue tables, the decisions and the changes
since October 15 each open from one line.

Every source chip on the TDH pages resolves to an anchor on this page, so no
chip links to a private repository.

## Location in the Site

- Route: `/network/tdh/specification`
- Page heading: `The TDH-v1 specification`
- Browser title: `The TDH-v1 specification | Network`
- About contents menu: `TDH specification`
- TDH section navigation: `Specification`

## Anchors

- `#symbols`; sections `#s1` to `#s13`, subsections such as `#s3-1`,
  `#s5-2`, `#s7-3` and `#s8-4`.
- Deviations `#dev-1` to `#dev-19`, issues `#bug-1` to `#bug-15`.
- Decisions `#d112`, `#d116`, `#d118`, `#d119`, `#d121`, `#d122`, `#d125`,
  `#d128`, `#d130`, `#d131`, `#d132`.
- Evidence `#evidence-replay`, `#evidence-clean-room`, `#evidence-comparison`,
  `#evidence-difftest`; changes `#changes`.

## Interactive Elements

- Contents list that highlights the section in view.
- A link button beside each heading copies the section address.
- Copy buttons on rule blocks, contract addresses and the registry hash.
- Deviation filter: `All`, `Can change values`, `Kept as before`. From
  `xl` the deviations are one table; below it each is one line (its id,
  whether it can change values, and its rule in a line) that opens to its
  decision, the old backend's behaviour, TDH-v1's and the measured effect.
  Those that can change values start open, and a link to `#dev-2` opens its
  row. A legend sits under the list. Section 11 uses the whole content
  width, and its decision dots use the one TDH status palette.
- The symbol table is one definition list, two columns from `md`, each
  symbol with its meaning and the section chip inline; `H(name, …)`, P28's
  tagged hash, has its own entry beside `H`, the largest edition.

## Notes

- Section 7 shows P26 §7.1 in three blocks (the underflow test before
  netting, transaction netting (D131), the replay after netting), the
  property with the Lean theorem's form and both of its limits (whole
  transactions added or removed, and the canonical sort), where it stops
  (§5's mint facts read the steps), then §7.2's per-token values and §7.3's
  records. Transaction netting, which P26 writes in English, is a numbered
  list in body type inside the exact rule's frame, with its names (`M`,
  `net(w)`, `k`) in mono; it keeps P26's own name for a set of transfers,
  M, with a note that it is not the cycle boundary M of section 4. Under the replay, P26's note that removal is from the end
  of the list and that, after a move inside an identity, an old timestamp
  can be removed first (legacy behaviour that MUST be kept). §7.3's example
  gives its premise: each Gradient with base 100.
- Section 4.2 states the whole rule for decoded transfers' timestamps,
  with its MUST NOT: two of one block may differ, they may fall as the
  block number rises, and one need not carry the header set's timestamp
  for its block; an implementation must not refuse an input for these.
- Section 9 quotes the cycle root validators are to sign (P53 §4.2), with
  `H` named as P28's tagged hash and `NETWORK_ID` defined in the block
  (P53 §3.1, `0x305a60a8…cd102`), and restates the leaves of its two trees
  (P28 §3.3, §4.3, §4.4 and §4.12: `cid`, the hash of the identity's
  wallets, the wallet leaf and the per-token leaf, their order, and the list
  tree's `NODE`, `TOP` and `ROOT`); section 10 gives how the registry hash
  is computed (P28's `TAG`, `H`, `abi.encode` with the declared types, and
  the stored CE record) and tags the eight rows that restate formulas
  (`formula`: fixed by the rule version, not fields of the hashed record);
  section 6.3 adds one line on four wallets: 6529.io accepts four
  consolidated wallets since October 15, 2026, and `tdh-v1.0` allows three;
  whether it allows four is pending an owner decision. P28's tagged
  hash is written `TH` on the page (P28 writes `H`), so `H` stays the
  largest edition. Sections 11 and 12 show their first three rows inline,
  with `Show all 19 differences` and `Show all 15 issues`. Section 13 has a `For implementers` checklist: values and
  records (sections 4 to 8), the day's output (section 9), the registry
  hash (section 10), and what can be checked today (vector 28, and vectors
  04, 06, 23 and 36, restated in full on the Implementations page), then
  one line: no vector checks a root, the rest of P28 is not needed, and the
  other vectors are to be published with the validator code (D116); the
  SHA-256 of P28 and P53 at `f840096` are in a disclosure.
- Syntax tinting keeps names with digits whole and plain: a section
  (`§3.2`), the rule version (`tdh-v1.0`), `DEV-10`, `BUG-15`, `ERC-1155`.
  The phone `Contents` pill is solid, 8 px off the bottom edge.
- The evidence's replay links 6529.io's published identities and wallets
  files for 2026-10-11 on Arweave and its list of daily uploads.
- The evidence's four-way differential tests say what became of the five
  rounds' findings: the first four rounds' were settled and pinned by new
  vectors, in P26 or, for E8 (an event's default use case), in the vector
  format and the references; the fifth round's E13 is still open for the
  vector format.
- The sections map runs inputs (§2), the snapshot (§4), canonical events
  (§3): the snapshot block comes from the finalized chain, and §3 selects
  the logs in blocks up to it. §4.2's rule block is anchored `#s4-2`, and the
  details under it, whole days among them, `#s4-3`. The cutoff rule
  cites vector 74's case 0 for the top block and cases 1-6 for dates.
- The sections map draws the parameter registry (§10) on a bus line under
  sections 2 to 8, with an arrow up into each, every node the same height
  from `xl`. §6.2's state machine labels REVOKE's target as pending the
  other way.
- A subsection's plain words are ordinary prose; only a section's summary
  carries the primary rule at its side. Rule blocks and tables take the
  whole content column; prose keeps its measure.
- Rule blocks (`TdhRuleBlock`) set code and comments on a grid: every
  trailing comment of a block starts at one column, and a comment written
  alone under its line (a vector reference, the rest of a field's comment)
  joins that line's comment; a comment in the first column heads the lines
  below it. Keywords, numbers, strings and rule names are tinted; the copy
  button copies the text as written.
- Exact rules and P26's prose rules restated line by line keep their lines
  and wrap at every width with a hanging indent, so nothing scrolls
  sideways or is cut at the edge; on phones a trailing comment drops below
  its line, at the line's continuation indent. Keywords are tinted only in
  pseudocode, and not on a line of plain English; the restated prose rules
  get no keyword tint. Column-aligned blocks (§8.7's range) and shell
  commands never wrap: they scroll, with a visible scrollbar. At 1440 px
  no line of an exact rule wraps; at 390 px a wrapped line keeps its hanging
  indent (`scripts/tdh-pages-check.mjs` checks both). A block of one or two
  lines is one compact row (the code, its source chip and the copy button);
  a block of 16 lines or more shows its first lines and `Show all N lines`
  at every width.
- `Changes since October 15` says that two of the seven changes concern a
  real day's values: the edition-floor correction (a text that would have
  lowered 285 identities by 111,494 TDH on October 11) and D131's netting;
  the vectors grew from 35 to 89. The five rounds of differential tests are
  linked to their table on the Implementations page.
- Rule blocks longer than seven lines are numbered, and comments are set in
  a quieter colour. The deviations table's ID column is narrow; from `xl`
  the `Can change values` mark heads the effect instead.
- The page is static content; changing it is a reviewed content change
  against the new P26 text.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH Implementations](feature-tdh-implementations.md)
