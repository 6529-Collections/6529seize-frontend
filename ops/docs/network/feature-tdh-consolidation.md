# Combine Your Wallets (Wallet Consolidation)

Parent: [Network Index](README.md)

## Overview

Two pages explain wallet consolidation:

- `/network/tdh/consolidation` is the collector's guide. It explains, in plain
  words, why to combine wallets, which wallets to combine, how to do it with the
  guided setup, and what to know first.
- `/network/tdh/consolidation/design` is the technical page. It sets out the
  exact rules, the transactions, an interactive signing-order simulator and the
  tested analysis behind the four-wallet, full-mesh design, including what
  consolidation protects against and what it does not.

## Location in the Site

- Guide route: `/network/tdh/consolidation`
  - Page heading: `Combine your wallets`
  - Browser title: `Combine your wallets | Network`
  - About contents and sidebar: `Wallet Consolidation`, in the Network group
    after `TDH Historic Boosts`
- Design route: `/network/tdh/consolidation/design`
  - Page heading: `How wallet consolidation works`
  - Browser title: `How wallet consolidation works | Network`
  - Reached from the guide's `Under the hood` section; not in the sidebar

## Entry Points

- Open either route directly.
- Select `Wallet consolidation` in the `Explore the network` cards on
  `/network/tdh`.
- Select `Wallet Consolidation` in `Explore Network references` on Network
  reference pages, or in the About contents menu or sidebar.
- From the guide, select `Read how it works` to open the design page. The
  design page links back with `Read the collector's guide`.

## Guide Sections (`/network/tdh/consolidation`)

1. Header: the promise (several wallets count as one collector; nothing moves),
   the four-wallet limit and the fourth wallet's start date
   (loaded from the current environment’s settings), a `Start guided setup` button to
   `/safe-collecting/build-consolidation`, and a link to the safe collecting setup.
   A figure shows the vault, transaction, social and old wallets becoming one
   collector.
2. `Why combine`: the vault stays cold; TDH adds up; sets count across wallets;
   moving cards keeps holding time; old wallets keep their TDH; one profile and
   one collection (profile, leaderboards, Meme Card subscriptions).
3. `Which wallets to combine`: the safe collecting roles, each with a
   temperature dot: vault (holds NFTs, never connects), transaction wallet
   (buys, sells and trades; can manage the vault), social wallet (the hot
   wallet that signs in to 6529), and an optional old wallet (a burned or
   exposed address kept for its TDH). Three wallets is enough to start.
4. `How to set it up`: list your wallets by Ethereum address or ENS name and follow the signing steps. ENS names resolve to mainnet addresses before planning; unresolved names block the plan, and names resolving to the same address count as duplicates. A wallet signing for itself
   batches its links; a Delegation Manager sends one transaction per link
   while the vault stays disconnected. A note on signing
   order and a second `Start guided setup` button.
5. `Before you start`: every combined wallet can sign in as the profile;
   profiles merge permanently; combining is public and moves nothing.
6. `Changing it later`: add, remove, lost or hacked wallet, and replacing a
   wallet when four are already combined.
7. `Questions`: cost, moving NFTs, the limit, friends, wallets set up before
   the start date, profiles, wrong order, where to see it, expiry.
8. `Under the hood`: cards for the design page, the TDH explainer, the Wallet
   Checker and the Delegation Center.

## Design Page Sections (`/network/tdh/consolidation/design`)

1. `The rules`: every pair of wallets registers use case `999` both ways; up to
   four wallets; a fourth wallet counts only for links registered in both
   directions on or after the cutoff supplied by the current environment; the newest confirmed link
   wins; consolidations are for one collector; registrations do not expire;
   what consolidation changes for TDH and profiles.
2. `Add a wallet in four transactions`: the two steps (existing wallets each
   register one link to the new wallet, then the new wallet signs one
   `batchDelegations` transaction last), why the order matters, a table of
   links and transactions for common changes, and a link to the guided setup.
   Old return links and separate manager transactions can temporarily split
   the group despite following that order.
3. `Try the signing order`: an interactive simulator using the backend
   grouping rule. The example assumes no existing D return links and one
   self-signed transaction per wallet.
4. `Remove or replace a wallet`: batch revocation, replacement order by group
   size, revocations for a lost or compromised wallet, and which part keeps the
   profile when a consolidation splits.
5. `Why every pair: the alternatives we tested`: the full-mesh rule compared
   with majority, fan-out and single-link rules, and a table of whether an
   outside wallet can be added when an attacker controls 0 to 3 wallets.
6. `What consolidation protects, and what it does not`.
7. `Why the fourth wallet has a start date`, with the 2026-10-10 live snapshot.
8. `How it was tested`, with links to the grouping source and tracking issue.
9. `Related` links, starting with the guide.

## States

- Static content; no loading or error states on either page.
- The simulator starts with no order chosen. `D signs last`, `D signs first`
  and `Start again` change the order. A polite live region announces each
  step's groups, and the overall result when all four have signed.

## Localization

- Copy is message-backed in `en-US` only. Other supported locales fall back
  to `en-US` for these pages, as they do for the rest of the TDH pages.
- Impact: readers using another locale see English text; dates and numbers
  still use their locale's formatting.
- Follow-up: translate `network.tdhConsolidation.*` with the other TDH pages
  (tracked in 6529-Collections/6529seize-frontend#4214).

## Source

- Routes: `app/network/tdh/consolidation/` and
  `app/network/tdh/consolidation/design/`
- Copy: `i18n/messages/networkTdhConsolidation.en-US.json`
- Shared rule constants: `constants/consolidation.constants.ts`
- Backend grouping: `6529seize-backend` `src/consolidation-tools.ts`

The guide and design page read the wallet maximum and ungated boundary from the existing backend settings response and show the current environment’s cutoff; staging can open before production. Guided signing opens ten minutes later. If settings are unavailable, the pages refer visitors to Guided Setup for the activation time without substituting a production date. The simulator models post-cutoff transactions and labels that assumption with the same date. It uses the shared backend limits and waits for valid limits before showing simulated groups; neither page substitutes a local maximum when limits are unavailable.
