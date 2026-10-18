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

1. Header: the promise (several wallets count as one collector), then one
   status line, information rather than a warning (a grey rule, not amber):
   up to four wallets, three as before and a fourth only with links
   registered in both directions from the start date (loaded from the
   current environment's settings), counted the same way by 6529.io and by
   TDH v1.4, the rules the validators compute (D136). A `Start guided setup` button to
   `/safe-collecting/build-consolidation`, a link to the safe collecting
   setup as an arrow link, and under the button `Nothing moves. Your NFTs
   stay in the wallets they are in.` A figure, top-aligned with the
   heading, shows the vault, transaction, social and old wallets becoming
   one collector, each with a neutral role icon: one 44 px row a wallet (a
   list on phones, two columns from `sm`), the old wallet's row tagged
   `4th: fresh links only` in grey.
2. `Why combine`: the vault stays cold; TDH adds up; sets count across wallets;
   moving cards keeps holding time; old wallets keep their TDH; one profile and
   one collection (profile, leaderboards, Meme Card subscriptions). The six
   cards share one anatomy; one line of sources and one link to step 10 of
   How TDH is calculated sit under them.
3. `Which wallets to combine`: the safe collecting roles, each with a
   neutral role icon (no colour, so none reads as a status): vault (holds
   NFTs, never connects), transaction wallet (buys, sells and trades; can
   manage the vault), social wallet (the hot wallet that signs in to 6529),
   and an optional old wallet (a burned or exposed address kept for its
   TDH). Three are enough for most collectors.
4. `How to set it up`: list your wallets by Ethereum address or ENS name and follow the signing steps. ENS names resolve to mainnet addresses before planning; unresolved names block the plan, and names resolving to the same address count as duplicates. A wallet signing for itself
   batches its links; a Delegation Manager sends one transaction per link
   while the vault stays disconnected. The last step says when TDH updates
   (today 6529.io may update it within minutes and fully at the next daily
   snapshot; from the cutover only the links standing at the next snapshot
   block count). The list step's note links to the status line (`The
   fourth wallet: see the note above.`). A note on signing
   order and a second `Start guided setup` button. Guided setup itself
   shows a grey note as soon as a fourth wallet is listed: a group of four
   counts as one collector only when one of its wallets has links with each
   of the other three registered in both directions from the start date;
   with older links three of them count; the steps register the links that
   need it, so all four count, on 6529.io and in TDH v1.4. It links to step
   10 of How TDH is calculated and asks for no confirmation.
5. `Before you start`: three cards, each a bold first line with the detail
   under it (`Any combined wallet can act as you`, `Profiles merge for
   good`, `It is public`).
6. `Changing it later`: add, remove, lost or hacked wallet, and replacing a
   wallet when four are already combined.
7. `Questions`: cost, moving NFTs, the limit (up to four: three as before,
   and a fourth only when one wallet has links with each of the other three
   registered in both directions from the start date; 6529.io and TDH v1.4
   count them the same way), friends, wallets set up before the start date
   (three of them count: in a group of four that all confirm each other, if
   D's three links were the last confirmed, D–A, then D–B, then D–C, the
   three are D, C and B; guided setup with all four registers the missing
   links again so all four count), profiles,
   wrong order, where to see it, expiry, in the TDH pages' disclosure
   style, every answer closed until opened. The copy uses typographic apostrophes throughout.
8. `Under the hood`: cards for the design page, the TDH explainer, the Wallet
   Checker and the Delegation Center.
9. The TDH pager: previous `Verification`, next `Historic boosts`. `Under
the hood` is one list of links (the design page first), and the page has
   no other navigation block at its end.

## Design Page Sections (`/network/tdh/consolidation/design`)

The intro says what the page is (the rules, the transactions and the
analysis behind 6529.io's consolidation design), then the same status line
as the guide, and that a collector needs none of it, with an arrow link to
the collector's guide.

1. `The rules`: every pair of wallets registers use case `999` both ways; up to
   four wallets, three as before; a group of four counts only when one of
   its wallets has links with each of the other three registered in both
   directions on or after the cutoff supplied by the current environment;
   the newest confirmed link wins (links confirmed in one block in a fixed
   order, by the pair's addresses); consolidations are for one collector;
   registrations do not expire; what consolidation changes for TDH and
   profiles, until the cutover and from it (the grouping counts as it
   stands at the snapshot block, DEV-9). The newest-link card says that
   6529.io and TDH v1.4 form groups the same way. The six cards fill two columns, each sized to
   its content, so a short card never shows an empty frame. The page's contents are a numbered `On this page`
   list (a collapsed menu on phones, with the shared chevron).
2. `Add a wallet in four transactions`: the two steps (existing wallets each
   register one link to the new wallet, then the new wallet signs one
   `batchDelegations` transaction last), why the order matters, a table of
   links and transactions for common changes, and a link to the guided
   setup. On a phone each row of the table is its title, links and
   transactions on one line, and the order on the next.
   Old return links and separate manager transactions can temporarily split
   the group despite following that order.
3. `Try the signing order`: an interactive simulator using the grouping rule
   of 6529.io and TDH v1.4 (newest confirmed link first, every member linked
   both ways, up to four wallets, a fourth only with fresh links). The example assumes no existing D return
   links and one self-signed transaction per wallet. Before anyone signs it
   draws A, B and C as one group and D alone. Its buttons are the
   explorables' shared button; `Start again` shows once there is a step to
   undo.
4. `Remove or replace a wallet`: a table of four cases (leave with a wallet
   you still control; replace in a group of two or three; replace in a
   group of four; a lost or compromised key) and what to do in each, then
   which part keeps the profile when a consolidation splits.
5. `Why every pair: the alternatives we tested`: the full-mesh rule compared
   with majority, fan-out and single-link rules (the `Must sign` column's
   tooltip says it counts existing wallets, and `Transactions`' that it counts those that add the fourth wallet; from `xl` the columns have
   fixed widths, so the short headers do not wrap), and a table of whether an
   outside wallet can be added when an attacker controls 0 to 3 wallets, as
   one compact grid at every width (a column per number of wallets, under a
   header that names them: `Your wallets the attacker controls`).
6. `What consolidation protects, and what it does not`.
7. `Why the fourth wallet has a start date`: why, a diagram of the same
   four wallets and six links twice (shared with step 10 of How TDH is
   calculated): one identity of four when D's three links were registered
   both ways from October 15, 2026, drawn in green, and D, C and B with A
   alone when every link predates it; then the 2026-10-10 live snapshot.
8. `How it was tested`: three figures (673 live consolidations grouped
   identically by the backend's own code, 500 random wallet graphs, 1,000
   random register-and-revoke sequences), one line that TDH v1.4's grouping
   rule (P26 §6.2 and §6.3, D136) and 6529.io's own grouping code, run
   side by side, gave the same groups on 100,000 random link graphs and on
   the delegation contract's whole history to October 18, 2026, and that
   each rule was checked exhaustively, and links to the grouping
   source, pinned to its latest change (6529seize-backend `ee74952`), and
   the tracking issue that records the October 10 dry run.
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

The design page's four-wallet diagram is
`app/network/tdh/shared/diagrams/IdentityGraphs.tsx`. The guide and design page read the wallet maximum and ungated boundary from the existing backend settings response and show the current environment’s cutoff; staging can open before production. Guided signing opens ten minutes later. If settings are unavailable, the pages refer visitors to Guided Setup for the activation time without substituting a production date. The simulator models post-cutoff transactions and labels that assumption with the same date. It uses the shared backend limits and waits for valid limits before showing simulated groups; neither page substitutes a local maximum when limits are unavailable.
