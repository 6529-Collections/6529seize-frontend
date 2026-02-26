# Delegation

## Overview

Delegation docs cover user-facing behavior for `/delegation/*`.

This area includes:

- section navigation and HTML-backed content routes
- write routes for delegation, consolidation, sub-delegation, and primary-address assignment
- collection management (`Outgoing`/`Incoming`, edit, revoke, batch revoke, lock/unlock)
- wallet diagnostics in Wallet Checker (`/delegation/wallet-checker`)

Use this area when you need route behavior, action requirements, wallet/network
prerequisites, transaction feedback states, or checker recovery paths.

## Features

- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md): section routes, desktop/mobile menu behavior, HTML fallback mapping, and query-param cleanup rules.
- [Delegation Write Action Routes](feature-delegation-action-flows.md): write forms, query-prefill behavior, manager write variants, and onchain feedback states.
- [Delegation Collection Management](feature-delegation-collection-management.md): collection route accordions, row actions, batch revoke limits, manager actions, and locks.
- [Wallet Checker](feature-wallet-checker.md): read-only diagnostics, deep-link checks, and consolidation recommendations.

## Flows

- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md): start at Delegation Center, execute writes, then verify outcomes.

## Troubleshooting

- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md): route fallback issues, validation failures, network mismatch, and checker confusion.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
