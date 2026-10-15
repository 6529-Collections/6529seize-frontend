# TDH-v1 Specification

Parent: [Network Index](README.md)

## Overview

`/network/tdh/specification` restates specification P26 (TDH-v1, rule
version `tdh-v1.0`, text of 15 October 2026) section by section: each section
in plain words beside the exact rule. It also lists the parameter registry
and its hash, the 19 deviations from the old backend with their decisions,
the 15 old-backend issues, the decisions the TDH pages cite, and the evidence.

Every source chip on the TDH pages resolves to an anchor on this page, so no
chip links to a private repository.

## Location in the Site

- Route: `/network/tdh/specification`
- Page heading: `The TDH-v1 specification`
- Browser title: `The TDH-v1 specification | Network`
- TDH section navigation: `Specification`

## Anchors

- Sections `#s1` to `#s13`, subsections such as `#s5-2` and `#s8-4`.
- Deviations `#dev-1` to `#dev-19`, issues `#bug-1` to `#bug-15`.
- Decisions `#d112`, `#d116`, `#d118`, `#d119`, `#d121`, `#d122`, `#d125`,
  `#d128`, `#d130`, `#d131`, `#d132`.
- Evidence `#evidence-replay`, `#evidence-clean-room`, `#evidence-comparison`.

## Interactive Elements

- Contents list that highlights the section in view.
- A link button beside each heading copies the section address.
- Copy buttons on rule blocks, contract addresses and the registry hash.
- Deviation filter: `Changes values`, `Kept as before`, `All`.

## Notes

- D131 (netting within a transaction) is decided and shown as pending text
  until P26 carries it.
- The page is static content; changing it is a reviewed content change
  against the new P26 text.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH Formal Model](feature-tdh-formal-model.md)
- [TDH Implementations](feature-tdh-implementations.md)
