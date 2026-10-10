# Wallet Consolidation

Parent: [Network Index](README.md)

## Overview

`/network/tdh/consolidation` explains how up to four of one collector's wallets
count as one for TDH and for their profile. It sets out the rules, the
transactions involved, and the tested analysis behind the full-mesh design,
including what consolidation protects against and what it does not.

## Location in the Site

- Route: `/network/tdh/consolidation`
- Page heading: `Wallet consolidation`
- Browser title: `Wallet consolidation | Network`
- About contents and sidebar: `Wallet Consolidation`, in the Network group
  after `TDH Historic Boosts`

## Entry Points

- Open `/network/tdh/consolidation` directly.
- Select `Wallet consolidation` in the `Explore the network` cards on
  `/network/tdh`.
- Select `Wallet Consolidation` in `Explore Network references` on Network
  reference pages.
- Select `Wallet Consolidation` in the About contents menu or sidebar.

## Page Sections

1. `The rules`: every pair of wallets registers use case `999` both ways; up to
   four wallets; a fourth wallet counts only for links registered in both
   directions on or after `2026-10-15 00:00 UTC`; the newest confirmed link
   wins; consolidations are for one collector; registrations do not expire;
   what consolidation changes for TDH and profiles.
2. `Add a wallet in four transactions`: the two steps (existing wallets each
   register one link to the new wallet, then the new wallet signs one
   `batchDelegations` transaction last), why the order matters, and a table of
   links and transactions for common changes. Links to the Delegation Center.
3. `Try the signing order`: an interactive simulator. A, B and C are
   consolidated and D joins; the reader picks the signing order (or a preset)
   and sees the groups after each transaction. It reports whether A, B and C
   stayed together. The simulator uses the backend grouping rule.
4. `Remove or replace a wallet`: one batch revocation for a wallet you
   control, add-then-remove replacement, back-to-back revocations for a lost or
   compromised wallet, and which part keeps the profile when a consolidation
   splits.
5. `Why every pair: the alternatives we tested`: the full-mesh rule compared
   with majority, fan-out and single-link rules, and a table of whether an
   outside wallet can be added when an attacker controls 0 to 3 of the
   collector's wallets.
6. `What consolidation protects, and what it does not`: admission needs every
   wallet; old registrations cannot fill the fourth slot; every wallet is still
   a full key to the profile; delegation managers; the use case `999` lock.
7. `Why the fourth wallet has a start date`: the reason for the activation gate
   and the 2026-10-10 live snapshot (673 consolidations; none change at
   activation).
8. `How it was tested`: the live-data check, exhaustive searches and property
   tests, with links to the grouping source and the tracking issue.
9. `Questions` and `Related` links.

## States

- Static content; no loading or error states.
- The simulator starts with no order chosen. `D signs last`, `D signs first`
  and `Start again` change the order. Each wallet button disappears once that
  wallet has signed; the result is announced in a polite live region when all
  four have signed.

## Source

- Route: `app/network/tdh/consolidation/`
- Copy: `i18n/messages/networkTdhConsolidation.en-US.json`
- Shared rule constants: `constants/consolidation.constants.ts`
- Backend grouping: `6529seize-backend` `src/consolidation-tools.ts`
