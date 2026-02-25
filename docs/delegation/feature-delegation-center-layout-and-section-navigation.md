# Delegation Center Layout and Section Navigation

## Overview

The Delegation Center uses a section-based shell under `/delegation/*`. Users
switch between delegation sections from a local menu while the route updates to
the selected section path.

On desktop, the page keeps a two-column layout:

- left section menu (`20%`)
- right content panel (`80%`)

On small screens, the left menu column is replaced by a full-width section menu
above the content.

## Location in the Site

- Route family: `/delegation/<section>`
- Sidebar entry path:
  `Tools -> NFT Delegation -> Delegation Center` (and related delegation links)
- Common menu sections:
  - `/delegation/delegation-center`
  - `/delegation/wallet-architecture`
  - `/delegation/delegation-faq`
  - `/delegation/consolidation-use-cases`
  - `/delegation/wallet-checker`

## Entry Points

- Open a delegation route from `Tools -> NFT Delegation` in the sidebar.
- Open a `/delegation/<section>` URL directly.
- Use section actions inside Delegation Center cards (for example,
  `Delegation`, `Consolidation`, or `Delegation Management`) to enter
  registration flows.

## User Journey

1. Open `/delegation/delegation-center`.
2. Choose a section from the delegation menu.
3. The route updates to the selected section path and content panel.
4. Continue switching sections without leaving the `/delegation/*` route family.
5. On small screens, use the full-width section menu shown above content.

## Common Scenarios

- Open `Delegation Center`, then move to `Wallet Architecture` or
  `Delegation FAQ` from the local section menu.
- Open `Wallet Checker` to validate wallet/delegation relationships without
  leaving delegation routes.
- Use delegation-center action buttons to move into registration routes such as
  `register-delegation` or `register-consolidation`.
- Share direct links to a specific delegation section.

## Edge Cases

- On viewports narrower than `1000px`, the desktop left menu is hidden and the
  full-width menu is shown above content.
- Query parameters are preserved only where relevant:
  - `address` persists for `wallet-checker` and `assign-primary-address`.
  - `collection` and `use_case` persist for `register-delegation`.
  - Other sections clear unused query parameters.
- Unknown or non-enum section paths load the delegation HTML-content viewer
  route handler instead of a standard section panel.

## Failure and Recovery

- If a user starts an action that requires wallet connection while disconnected,
  the connect flow opens first, then the requested section opens after
  successful connection.
- If a delegated HTML content URL cannot be loaded, the page shows a `404 | PAGE
  NOT FOUND` state.
- If external reference links (Etherscan/GitHub) fail to load, users remain on
  the current section and can retry opening the link.

## Limitations / Notes

- This page documents delegation shell layout and section navigation; it does
  not yet detail every form field/validation path inside each delegation action.
- Section rendering depends on valid `/delegation/<section>` path segments.
- Delegation menu options are route-based and do not open as in-page tabs.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Action Flows](feature-delegation-action-flows.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
- [Docs Home](../README.md)
