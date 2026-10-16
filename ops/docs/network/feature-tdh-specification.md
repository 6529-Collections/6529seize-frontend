# TDH-v1 Specification

Parent: [Network Index](README.md)

## Overview

`/network/tdh/specification` restates specification P26 (TDH-v1, rule
version `tdh-v1.0`, at commit `f840096`, its latest change, October 16, 2026)
section by section: each section in plain words beside the rule, either quoted
(`Exact rule`) or P26's prose rules line for line (`Rule, line for line from
P26`): log selection and positions, decoding, mints and sinks, header order,
delegation events, identities, records, totals, the numeric range and the
registry's constraints. It opens with a
map of how the sections feed each other and a symbol table, and lists the
parameter registry and its hash, the 19 deviations from the old backend with
their decisions, the 15 old-backend issues, the decisions the TDH pages cite,
and the evidence.

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
- Evidence `#evidence-replay`, `#evidence-clean-room`, `#evidence-comparison`.

## Interactive Elements

- Contents list that highlights the section in view.
- A link button beside each heading copies the section address.
- Copy buttons on rule blocks, contract addresses and the registry hash.
- Deviation filter: `All`, `Can change values`, `Kept as before`; each
  deviation is a card with its decision, the old backend's behaviour,
  TDH-v1's and the measured effect, with a legend under the list.

## Notes

- Section 7 shows P26 §7.1 in three blocks (the underflow test before
  netting, transaction netting (D131), the replay after netting), the
  property and where it stops, then §7.2's per-token values and §7.3's
  records.
- Rule blocks longer than seven lines are numbered, and comments are set in
  a quieter colour.
- The page is static content; changing it is a reviewed content change
  against the new P26 text.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH Implementations](feature-tdh-implementations.md)
