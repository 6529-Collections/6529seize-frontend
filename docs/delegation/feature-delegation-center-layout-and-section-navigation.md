# Delegation Center Layout and Section Navigation

## Overview

Use this page for how users move inside `/delegation/*`.
Section switching is route-based (`/delegation/<section>`), not local tab
state.

## Route Scope

- Route handler: `/delegation/[...section]`
- No bare `/delegation` route.
- Known section routes render delegation UI panels.
- Unknown or multi-segment paths render HTML fallback content.

## Entry Points

- Sidebar: `Tools -> NFT Delegation`
  - `/delegation/delegation-center`
  - `/delegation/wallet-architecture`
  - `/delegation/delegation-faq`
  - `/delegation/consolidation-use-cases`
  - `/delegation/wallet-checker`
- Direct URL to any `/delegation/<section>` route.
- From `/delegation/delegation-center` cards:
  - action routes: `/delegation/register-delegation`,
    `/delegation/register-consolidation`,
    `/delegation/register-sub-delegation`
  - collection routes: `/delegation/any-collection`, `/delegation/the-memes`,
    `/delegation/meme-lab`, `/delegation/6529-gradient`
  - `assign-primary-address` has no center card; open it by URL or collection
    manager actions

## Section Menu Behavior

- Desktop (`> 1000px`): left menu stays beside content.
- Mobile/tablet (`<= 1000px`): full-width menu renders below content.
- Both menus include `Etherscan` and `Github` links that open in a new tab.
- Choosing a section updates URL to `/delegation/<section>` and scrolls to top.

## Query Parameter Rules

- `address` is kept only on:
  - `/delegation/wallet-checker`
  - `/delegation/assign-primary-address`
- `collection` and `use_case` are kept only on:
  - `/delegation/register-delegation`
- Switching sections clears unrelated query params.
- Known sections also strip unsupported query params on direct load.

## HTML Fallback Behavior

- Unknown sections and multi-segment paths use HTML fallback.
- Fallback key is the last URL segment.
  - Example: `/delegation/delegation-faq/security` loads `security.html`.
- Desktop keeps `Delegation FAQs` highlighted for nested FAQ paths.
- The mobile full-width menu does not keep that nested-path FAQ highlight.
- If HTML fetch is not `200`, the panel shows `404 | PAGE NOT FOUND`.
- HTML panels do not show a dedicated loading indicator.

## Connection Gate on Center Cards

- If a center-card action starts while disconnected, wallet connect opens first.
- If connect succeeds and the modal closes, the pending route transition
  continues.
- If the modal closes without a successful connect, the pending transition is
  canceled.

## Failure and Recovery

- If section state looks stale, navigate to `/delegation/delegation-center` and
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
