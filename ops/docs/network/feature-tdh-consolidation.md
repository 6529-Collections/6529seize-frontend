# Your Wallets (Wallet Consolidation)

Parent: [Network Index](README.md)

## Overview

Two pages of the TDH chapter of 6529 Explained explain wallet consolidation:

- `/network/tdh/consolidation`, page 2 `Your wallets`, is the collector's
  guide: why a number changed, the four-wallet rule (decision D136, live on
  6529.io since October 15, 2026), the safe way to add a fourth wallet, what
  to know before starting, and questions.
- `/network/tdh/consolidation/design`, shelf page S3 `Consolidation design`,
  is the reference: registrations pair by pair, the signing order, and what
  the rule protects and does not.

Both pages are built on the 6529 Explained kit. Their wallet models group
lettered example wallets with the TDH v1.4 engine
(`components/explained/engine/tdh.ts`, P26 §6.2 and §6.3); every date and
count comes from the facts layer (`lib/explained`) or the engine's registry.

## Location in the Site

- Guide route: `/network/tdh/consolidation`
  - Page heading: `Up to four wallets count as one collector.`
  - Chapter bar: `2 Your wallets`, under `Read`
- Design route: `/network/tdh/consolidation/design`
  - Page heading: `Why every pair of wallets links both ways`
  - Chapter bar: `Shelf: Consolidation design`
- Both take `?locale=` (en-GB, fr-FR, es-ES, de-DE).

## Guide Sections (`/network/tdh/consolidation`)

1. Header: the heading, a one-sentence lede, the marks `Decided D136` and
   `Live on 6529.io since Oct 15`, `Start guided setup`
   (`/safe-collecting/build-consolidation`) and `Explain my TDH`
   (`/network/tdh#explain`).
2. `#why`, first question: `Why did my number change? Pick what happened.`
   Five causes as buttons, one answer shown at a time: a move between your
   own wallets (with a small picture of A–B and B–C linked, A–C not: B and C
   count together, A alone), a wallet added, a copy sold or sent, a wallet
   unlinked, a new card.
3. `#four`, the rule: every pair links both ways and the newest link leads,
   with the model `Four wallets, one identity` (cases: three linked, one
   pair missing, four linked before October 15; adding D one link at a time
   or with D signing last in one batch), the exact rule beside it, and Break
   it linking a fifth wallet, which leaves one wallet out.
4. `#add`: the new wallet signs last, in one batch; the safe signing order
   as four boxes; cost, no re-signing, what to avoid.
5. `#before`: every wallet is a key; wave votes cut by a split are not
   restored; one delegation manager is one key.
6. `#faq`: five questions, the first open, and a link to the design page.
7. Back to 1 How it works, on to 3 The daily check, and How we know.

The old anchors (`#consolidation-status`, `-benefits`, `-wallets`,
`-steps`, `-before`, `-change`, `-faq`, `-under`) land in these sections.

## Design Page Sections (`/network/tdh/consolidation/design`)

1. The rule: each pair registers use case 999 both ways; 2, 6 and 12
   registrations for two, three and four wallets (computed from the
   registry's maximum).
2. Signing order: the same model, starting on D signing last in one batch;
   one link at a time shows the split.
3. What it protects and what it does not, and how the rule was checked.

The old anchors (`#consolidation-rules`, `-add`, `-order`, `-remove`,
`-why`, `-protects`, `-start`, `-tested`) land in these sections.

## States

- Both pages render on the server; the dates and counts come from the facts
  layer, which shows "not available" for a fact whose source is down.
- `Pick what happened` starts on the move between your own wallets. The
  wallet model starts on one pair missing (the guide) or D signing last in
  one batch (the design page); a polite live region announces each case's
  groups, and `Break it` toggles the fifth wallet on and off.

## Localization

- Both pages have complete message dictionaries for `en-US`, `en-GB`,
  `fr-FR`, `es-ES` and `de-DE`, under `explained.tdh.wallets.*` and
  `explained.tdh.design.*`.

## Source

- Routes: `app/network/tdh/consolidation/` and
  `app/network/tdh/consolidation/design/`
- Copy: `i18n/messages/explainedTdhWallets.*.json` and
  `explainedTdhDesign.*.json`, in five locales
- The model: `app/network/tdh/consolidation/walletPresets.ts` and
  `WalletsLens.tsx`

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH Verification Dashboard](feature-tdh-verification.md)
