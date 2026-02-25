# Delegation Center Layout and Section Navigation

## Overview

The delegation route family is served by `/delegation/[...section]`. Known
section values render dedicated delegation UI panels; unknown or nested section
paths fall back to the delegation HTML renderer.

## Location in the Site

- Route family: `/delegation/<section>`
- Sidebar entry group: `Tools -> NFT Delegation`
- Sidebar section routes:
  - `/delegation/delegation-center`
  - `/delegation/wallet-architecture`
  - `/delegation/delegation-faq`
  - `/delegation/consolidation-use-cases`
  - `/delegation/wallet-checker`
- Additional section routes in the same route family:
  - `/delegation/register-delegation`
  - `/delegation/register-sub-delegation`
  - `/delegation/register-consolidation`
  - `/delegation/assign-primary-address`
  - `/delegation/any-collection`
  - `/delegation/the-memes`
  - `/delegation/meme-lab`
  - `/delegation/6529-gradient`

## Entry Points

- Open delegation routes from `Tools -> NFT Delegation` in the sidebar.
- Open a `/delegation/<section>` URL directly.
- Use delegation-center cards (`Delegation`, `Consolidation`, `Delegation
  Management`) to route into action sections.
- Use `Manage by Collection` cards to route into collection sections.

## User Journey

1. Open `/delegation/delegation-center`.
2. Choose a section from the left menu (desktop) or full-width menu (small
   screens).
3. The route updates to `/delegation/<section>` and the right panel renders
   that section.
4. Continue switching sections without leaving `/delegation/*`.

## Common Scenarios

- Move between `Delegation Center`, `Wallet Architecture`, `Delegation FAQs`,
  `Consolidation Use Cases`, and `Wallet Checker` from the local section menu.
- Open nested FAQ routes such as `/delegation/delegation-faq/<topic>`.
- Use persistent external links (`Etherscan`, `Github`) from the section menu.

## Edge Cases

- Query params are preserved only on matching sections:
  - `address` on `wallet-checker` and `assign-primary-address`
  - `collection` and `use_case` on `register-delegation`
  - unrelated params are cleared when switching away
- Unknown sections and multi-segment section paths render the HTML fallback
  handler using the last segment as content key.
- At viewport widths `<= 1000px`, the desktop left menu is hidden and a
  full-width menu block is shown above content.

## Failure and Recovery

- If delegated HTML content does not return `200`, the panel shows
  `404 | PAGE NOT FOUND`.
- If an action card was started while disconnected, complete wallet connection
  and retry the intended route transition.
- If section state looks stale, navigate to `/delegation/delegation-center` and
  re-enter the section from menu links.

## Limitations / Notes

- Section navigation is route-based (`/delegation/<section>`), not tab-state in
  a single URL.
- `Wallet Architecture`, `Delegation FAQs`, and `Consolidation Use Cases` are
  remote HTML pages loaded at runtime.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Action Routes and Collection Management](feature-delegation-action-flows.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
