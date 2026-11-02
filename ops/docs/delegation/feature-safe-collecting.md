# Safe Collecting

Parent: [Delegation](README.md)

## Overview

`/safe-collecting` is **Safe Collecting**, the landing page for
6529's wallet safety system. It replaces the old contract-centred "Delegation
Center" landing with a collector-centred page that explains the whole system
and links to the tool for each step.

The promise: keep NFTs in a vault that never connects to anything, use 6529
from a hot wallet, and let consolidation, delegations, airdrops and
subscriptions keep working as if every wallet were one.

## Location in the Site

- Route: `/safe-collecting`
- `/delegation/delegation-center` permanently redirects here, preserving query
  parameters and section anchors such as `#safe-setup`.
- All tools and FAQ articles use `/safe-collecting/...`; old `/delegation/...`
  URLs permanently redirect to their corresponding new pages. The former
  `/about/nft-delegation` landing also redirects to this hub.
- Page heading and browser title: `Safe Collecting`
- Top tab in the delegation menu, the About contents and sidebar, the Tools
  index and the About NFT Delegation page all label it `Safe Collecting`.
- Forms that link back say `Back to Safe Collecting`.

## Sections

1. **Header**: the promise, a note that the page is built on the open-source
   NFTDelegation contract and cannot move NFTs, a `Set up your wallets` button
   (jumps to `#safe-setup`) and a `Check a wallet` link. A diagram shows the
   social and transaction wallets above the vault ("mints for the vault",
   "manages the vault"), the vault ("never connects to anything", "airdrops
   land here") and an optional old wallet, all inside one collector.
2. **Your wallets, each with one job** (`#safe-roles`): the Three Address
   Protocol roles, each with a temperature dot and chip, and what it holds,
   what it connects to and what it does on 6529:
   - Vault: ice-cold; a SAFE or a hardware wallet; holds NFTs; never connects.
   - Transaction wallet: warm; a hardware wallet; buys, sells and trades; acts
     as the vault's Delegation Manager.
   - Social wallet: hot; any wallet app; holds no NFTs; signs in, votes, posts
     and pays for subscriptions.
   - Old wallet: optional; a burned or exposed address kept for its TDH.
3. **What it does for you** (`#safe-benefits`): NFTs stay cold; everything
   counts as one; a hot wallet you can lose; mint with the vault's
   eligibility; airdrops land in the vault; one profile, any wallet.
4. **Your setup** (`#safe-your-setup`): see below.
5. **Set it up** (`#safe-setup`): two tabs.
   - `Starting fresh` (recommended; three wallets is enough): create three
     wallets; from the vault, sign once (ENS name and Delegation Manager);
     combine the wallets with the guided setup (the manager signs for the
     vault); optionally delegate minting to the social wallet; check where
     airdrops land; optionally lock the vault.
   - `Already collecting`: combine the wallets you use (up to four, including
     old addresses); move your best NFTs to a vault; appoint a manager for the
     vault; review who can act for your wallets in the Wallet Checker.
     Every step links to the tool that does it.
6. **Common tasks** (`#safe-tasks`): combine wallets, appoint a manager, let a
   wallet mint for another, choose where airdrops go, set the primary address,
   lock or unlock a wallet, remove a wallet or delegation, check any wallet.
   A `Worth knowing` box explains what a manager can do (anything in the
   vault's name; expiry does not limit it; revoking it does not undo what it
   registered), what expiry dates mean, and that every combined wallet can
   sign in as the profile.
7. **Learn more** (`#safe-learn`): the Three Address Protocol guide, the
   consolidation guide, Using a SAFE, and the FAQ.
8. **All tools** (`#safe-tools`): the original Delegations, Consolidations
   (with Guided Setup) and Delegation Management cards, and Manage by
   Collection.

Links with a hash (for example `#safe-setup`) scroll to and focus that
section's heading.

## Your Setup

- Disconnected: a prompt and a `Connect Wallet` button.
- Connected: the connected profile's consolidated wallets (or just the
  connected wallet), each with TDH, `Connected` and `Primary` badges, and
  facts read from `GET /api/delegations/{wallet}`:
  - `Managed by …` / `Manages …` (use case 998; expiry is ignored, as on
    chain)
  - `Can mint for …` (use cases 1 and 2, unexpired)
  - `Airdrops go to …` (use case 3, unexpired)
- A checklist: wallets combined; a wallet has a manager; a wallet can mint
  with another's eligibility. Missing items link to the right tool.
- Loading shows `Checking your wallets…`; a failed read shows an error with
  `Try Again`.

## Capacitor iOS

Subscription wording is omitted when NFT purchasing is hidden
(`useNftPurchasingVisibility`): the lead, the social wallet's role and the
airdrops benefit switch to versions without subscriptions.

## Localization

- Copy is message-backed in `i18n/messages/safeCollecting.en-US.json` and
  `i18n/messages/delegationTapGuide.en-US.json`, including the All tools cards,
  the menu labels and the page metadata.
- Safe Collecting and the TAP Guide have complete dictionaries for `en-US`,
  `en-GB`, `fr-FR`, `es-ES` and `de-DE`, including safety warnings and metadata.
- The collector guide, design explanation and signing-order simulator at
  `/network/tdh/consolidation` use the same five locales. Dynamic wallet limits,
  activation dates and simulator values still come from the existing settings
  and interpolation paths.
- Other delegation tools and legacy FAQ articles retain their existing locale
  coverage; these dictionaries do not translate all delegation forms.
- Guided consolidation instructions wrap full wallet addresses inside their
  cards on narrow screens, including a 375px viewport.

## Source

- `components/delegation/safe-collecting/`
- `components/delegation/DelegationCenter.tsx` (`embedded` mode for All tools)
- `components/delegation/DelegationCenterMenu.tsx`
- Product brief and verified contract facts: tracked in
  6529-Collections/6529seize-frontend#4214.
