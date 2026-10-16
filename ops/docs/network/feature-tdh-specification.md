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
map of how the sections feed each other and a symbol table, and lists the
parameter registry and its hash, the 19 deviations from the old backend with
their decisions, the 15 old-backend issues, the decisions the TDH pages cite,
the evidence and the changes since 15 October. The header carries the rule
version and a `Proposal, not adopted` pill, then one `Version` panel: the
rule version (not frozen until launch), the text (P26 at `f840096`), the
SHA-256 of P26's file with a copy button, so the text it restates can be
matched against the file later, where it is (P26, its vectors and the Lean
model in 6529's private design repository; the validator source, with a
copy of the vectors, to be published when the owner decides, D116) and its
status. Chips that cite P53, P38, P52 or P28
name their document and say it is in 6529's private design repository.

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
  records. The netting block names the transaction's set S, since M is the
  cycle boundary. Under the replay, P26's note that removal is from the end
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
  section 11 adds a note on groups of four wallets, which P26's list does
  not yet hold. Section 13 has a `For implementers` box: what can be checked
  today (the registry hash and vector 36, restated in full on the
  Implementations page), the conformance vectors once published (D116), and
  the SHA-256 of P28 and P53 at `f840096`.
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
  commands never wrap: they scroll, with a visible scrollbar. A block of 16 lines or more
  shows its first lines and `Show all N lines` on phones; one of 28 lines
  or more (§3.2's decoding), and the registry table, at every width.
- `Changes since October 15` says that two of the seven changes concern a
  real day's values: the edition-floor correction (a text that would have
  lowered 285 identities by 111,494 TDH on October 11) and D131's netting;
  the vectors grew from 35 to 89. The four rounds of differential tests are
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
