# Delegation Center Layout and Section Navigation

The landing page at `/safe-collecting` is now Safe Collecting; see
[Safe Collecting](feature-safe-collecting.md) for its content.

## Overview

Use this page for how users move inside `/safe-collecting/*`.
Section switching is route-based (`/safe-collecting/<section>`), not local tab
state.

## Route Scope

- Route handler: `/safe-collecting/[...section]`
- No bare `/delegation` route.
- Known section routes render delegation UI panels.
- Unknown or multi-segment paths render manifest-backed HTML fallback content.

## Entry Points

- Sidebar: `About -> Safe Collecting`
  - `/safe-collecting` (Safe Collecting)
  - `/safe-collecting/tap-guide`
  - `/safe-collecting/faq`
  - `/safe-collecting/consolidation-use-cases`
  - `/safe-collecting/wallet-checker`
- Direct URL to any `/safe-collecting/<section>` route.
- From `/safe-collecting` (Safe Collecting): setup steps, common
  tasks and learn links, plus the All tools cards:
  - action routes: `/safe-collecting/register-delegation`,
    `/safe-collecting/register-consolidation`,
    `/safe-collecting/register-sub-delegation`
  - collection routes: `/safe-collecting/any-collection`, `/safe-collecting/the-memes`,
    `/safe-collecting/meme-lab`, `/safe-collecting/6529-gradient`
  - `assign-primary-address` has no center card; open it by URL or collection
    manager actions

## TAP Guide

- `/safe-collecting/tap-guide` shows the `TAP Guide` tab: a native,
  plain-language page titled `The Three Address Protocol` (browser title
  `The Three Address Protocol (TAP) | 6529.io`).
- It leads with one rule: never connect a wallet that holds your NFTs to a link
  you saw on X or Discord. `Set up your wallets` opens
  `/safe-collecting#safe-setup`; `Combine your wallets` opens
  `/network/tdh/consolidation`.
- Sections: the three wallet roles (vault, transaction wallet, social wallet),
  the optional fourth wallet for old or exposed addresses, hardware wallets vs
  TAP, Good TAP and Great TAP, how 6529 helps (guided setup, Delegation Manager,
  minting delegation, airdrops), honest caveats and links to Using a SAFE,
  FAQ and Wallet Checker.
- On Capacitor iOS outside the US (or with an unknown country), the social
  wallet's job list omits paying for Meme subscriptions.
- The earlier long-form article stays reachable at
  `/safe-collecting/faq/reference-overview-wallet-architecture`.

## Section Menu Behavior

- Desktop (`> 1000px`): left menu stays beside content.
- Mobile/tablet (`<= 1000px`): full-width menu renders below content.
- Both menus include `Etherscan` and `Github` links that open in a new tab.
- Choosing a section updates URL to `/safe-collecting/<section>` and scrolls to top.

## Query Parameter Rules

- `address` is kept only on:
  - `/safe-collecting/wallet-checker`
  - `/safe-collecting/assign-primary-address`
- `collection` and `use_case` are kept only on:
  - `/safe-collecting/register-delegation`
- Switching sections clears unrelated query params.
- Known sections also strip unsupported query params on direct load.

## HTML Fallback Behavior

- Unknown sections and multi-segment paths use manifest-backed HTML fallback.
- Fallback key is the last URL segment.
  - Example: `/safe-collecting/faq/security` loads `security.html`.
- Both menus keep `FAQ` highlighted for nested FAQ paths.
- If a manifest article cannot be loaded or its hash does not match, the panel
  shows `404 | PAGE NOT FOUND`.
- HTML panels show `Loading article...` while content is loading.

## Connection Gate on Center Cards

- If a center-card action starts while disconnected, wallet connect opens first.
- If connect succeeds and the modal closes, the pending route transition
  continues.
- If the modal closes without a successful connect, the pending transition is
  canceled.

## Failure and Recovery

- If section state looks stale, navigate to `/safe-collecting` and
  re-enter the section from menu links.
- If a fallback HTML route fails, open a known section from the menu and retry.
- For write-route failures after navigation, use:
  - [Delegation Write Action Routes](feature-delegation-action-flows.md)
  - [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)

## Related Pages

- [Delegation Index](README.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
