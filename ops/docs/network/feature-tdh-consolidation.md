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
  - About contents and sidebar: `Wallet consolidation`, in the Network group
    after `TDH historic boosts`
  - TDH section navigation: `Wallet consolidation`
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
- From the guide, select `How consolidation works` under `Under the hood`
  to open the design page. The design page links back with `Read the
collector’s guide`.

## Guide Sections (`/network/tdh/consolidation`)

1. Header: the promise (several wallets count as one collector; nothing moves),
   the limit on 6529.io today with the recommendation to combine three,
   which stay one collector under TDH-v1, in two lines, then the two dates
   side by side (the fourth wallet's start date is loaded from the current
   environment's settings) (when a fourth wallet can join on 6529.io, and the
   cutover), a `Start guided setup` button to
   `/safe-collecting/build-consolidation`, and a link to the safe collecting
   setup as an arrow link. Below the button, a two-line note: from about
   October 23, 2026, TDH-v1 groups at most three wallets and a fourth counts
   on its own, with `How a group of four splits`, which opens the design
   page's TDH-v1 section (the full rule and its worked example).
   A figure, top-aligned with the heading, shows the vault, transaction,
   social and old wallets becoming one collector, each with a neutral role
   icon and the four tiles of equal height, the old wallet tagged `4th,
until cutover`, and a line under it saying that from the cutover a fourth
   wallet's cards stop adding to the others' sets and boost.
2. `Why combine`: the vault stays cold; TDH adds up; sets count across wallets;
   moving cards keeps holding time; old wallets keep their TDH; one profile and
   one collection (profile, leaderboards, Meme Card subscriptions). The six
   cards share one anatomy; one line of sources and one link to step 10 of
   How TDH is calculated sit under them.
3. `Which wallets to combine`: the safe collecting roles, each with a
   neutral role icon (no colour, so none reads as a status): vault (holds NFTs, never connects), transaction wallet
   (buys, sells and trades; can manage the vault), social wallet (the hot
   wallet that signs in to 6529), and an optional old wallet (a burned or
   exposed address kept for its TDH). Three are enough for most
   collectors, and they stay one collector under TDH-v1.
4. `How to set it up`: list your wallets by Ethereum address or ENS name and follow the signing steps. ENS names resolve to mainnet addresses before planning; unresolved names block the plan, and names resolving to the same address count as duplicates. A wallet signing for itself
   batches its links; a Delegation Manager sends one transaction per link
   while the vault stays disconnected. The last step says that in a group
   of four one wallet counts on its own from the cutover, with a link to
   the design page's TDH-v1 section, and the first step says three are
   recommended, inline. A note on signing order and a second
   `Start guided setup` button. Guided setup itself shows the same warning
   as soon as a fourth wallet is listed, with a checkbox (`I understand that
from the cutover one of the four wallets counts on its own…`): until it
   is ticked, the signing steps say `Confirm the note about a fourth wallet
above to see the steps.` and none can be signed.
5. `Before you start`: every combined wallet can sign in as the profile;
   profiles merge permanently; combining is public and moves nothing.
6. `Changing it later`: add, remove, lost or hacked wallet, and replacing a
   wallet when four are already combined.
7. `Questions`: cost, moving NFTs, the limit (up to four on 6529.io today,
   three recommended, with what TDH-v1 does with a fourth), friends, wallets
   set up before the start date (which three stay together: in a group of
   four that all confirm each other, if D's three links were the last
   confirmed, D–A, then D–B, then D–C, the three are C, D and B), profiles, wrong order, where to see it,
   expiry, in the TDH pages' disclosure style. The copy uses typographic
   apostrophes throughout.
8. `Under the hood`: cards for the design page, the TDH explainer, the Wallet
   Checker and the Delegation Center.
9. The TDH pager: previous `Verification`, next `Historic boosts`. `Under
the hood` is one list of links (the design page first), and the page has
   no other navigation block at its end.

## Design Page Sections (`/network/tdh/consolidation/design`)

The intro leads with TDH-v1's outcome (at most three wallets from the
cutover, so three are recommended), then the decision a collector needs, in
one box above `On this page`: the rule in one line, the split of a group of
four in two sentences, with a drawing of it in the style of How it works
step 10 (D's links numbered D–A, D–B, D–C; B, C and D outlined as one
identity; A in a ring of its own), and a link to the `TDH-v1` section; then
an arrow link to the collector's guide.

1. `The rules`: every pair of wallets registers use case `999` both ways; up to
   four wallets; a fourth wallet counts only for links registered in both
   directions on or after the cutoff supplied by the current environment; the newest confirmed link
   wins; consolidations are for one collector; registrations do not expire;
   what consolidation changes for TDH and profiles, today and under TDH-v1
   (the grouping at the snapshot block, at most three wallets). The
   four-wallet rule card says it applies on 6529.io until the cutover. The
   five short cards fill two columns from the top, and what consolidation
   changes, the long one, runs across the section under them. The page's contents are a numbered `On this page`
   list (a collapsed menu on phones, with the shared chevron).
   `Under TDH-v1: at most three` follows: the full rule, with the worked
   example (links D–A, then D–B, then D–C give C, D and B, and A alone), and
   a link to step 10 of How TDH is calculated.
2. `Add a wallet in four transactions`: the two steps (existing wallets each
   register one link to the new wallet, then the new wallet signs one
   `batchDelegations` transaction last), why the order matters, a table of
   links and transactions for common changes (with a line above it: rows
   with four wallets apply on 6529.io until the cutover), and a link to the
   guided setup.
   Old return links and separate manager transactions can temporarily split
   the group despite following that order.
3. `Try the signing order`: an interactive simulator using the backend
   grouping rule. The example assumes no existing D return links and one
   self-signed transaction per wallet; a status line above it says it
   simulates 6529.io until the cutover, and a note says what TDH-v1 forms
   from the same links. Before anyone signs it draws A, B and C as one
   group and D alone; once all four are grouped it adds TDH-v1's outcome of
   the same four wallets (B, C and D, and A on its own, when D's links were
   confirmed D–A, D–B, D–C). Its buttons are the explorables' shared
   button; `Start again` shows once there is a step to undo.
4. `Remove or replace a wallet`: batch revocation, replacement order by group
   size, revocations for a lost or compromised wallet, and which part keeps the
   profile when a consolidation splits.
5. `Why every pair: the alternatives we tested`: the full-mesh rule compared
   with majority, fan-out and single-link rules (the `Must sign` column's
   tooltip says it counts existing wallets; from `xl` the columns have
   fixed widths, so the short headers do not wrap), and a table of whether an
   outside wallet can be added when an attacker controls 0 to 3 wallets, as
   one compact grid at every width (a column per number of wallets).
6. `What consolidation protects, and what it does not`.
7. `Why the fourth wallet has a start date`, with the 2026-10-10 live snapshot.
8. `How it was tested`, with links to the grouping source, pinned to its
   latest change (6529seize-backend `ee74952`), and the tracking issue that
   records the October 10 dry run.
9. `Related` links as one list, starting with the guide.

## States

- Static content; no loading or error states on either page.
- The simulator starts with no order chosen. `D signs last` and `D signs
  first` set the order, and `Start again`, once a step is chosen, clears it. A polite live region announces each
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
