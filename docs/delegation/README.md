# Delegation

Delegation docs cover user-facing behavior under `/delegation/*`: route
switching, onchain write actions, collection management, and Wallet Checker
diagnostics.

## Overview

- Start from `/delegation/delegation-center` for most flows.
- Bare `/delegation` is not a valid page route.
- Use this area for section routing, write actions, collection routes, manager
  actions, lock controls, and Wallet Checker checks.
- Unknown or multi-segment delegation paths use HTML fallback by final segment.

## Quick Start

1. Need feature behavior by route family: start in **Features**.
2. Need end-to-end execution (center to write to verify): open **Flows**.
3. Need failure recovery: open **Troubleshooting**.

## Start by Goal

- Understand section routing, menu behavior, query carry/clear rules, or HTML
  fallback:
  [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- Complete write routes (`register-*`, `assign-primary-address`) and confirm
  required fields/prefills:
  [Delegation Write Action Routes](feature-delegation-action-flows.md)
- Manage collection rows, batch revoke, manager actions, and lock controls:
  [Delegation Collection Management](feature-delegation-collection-management.md)
- Run read-only wallet diagnostics and consolidation checks:
  [Wallet Checker](feature-wallet-checker.md)
- Run one continuous journey from center to onchain result verification:
  [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- Recover from not-found/fallback issues, blocked manager actions, validation
  failures, or chain mismatch:
  [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)

## Route Coverage

- Section routes: `/delegation/delegation-center`,
  `/delegation/wallet-architecture`, `/delegation/delegation-faq`,
  `/delegation/consolidation-use-cases`, `/delegation/wallet-checker`
- Write routes: `/delegation/register-delegation`,
  `/delegation/register-consolidation`, `/delegation/register-sub-delegation`,
  `/delegation/assign-primary-address`
- Collection routes: `/delegation/any-collection`, `/delegation/the-memes`,
  `/delegation/meme-lab`, `/delegation/6529-gradient`
- Bare route: `/delegation` resolves to not-found (no page route).
- Unknown or multi-segment delegation paths use HTML fallback by final segment.

## Read In This Order

1. [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
2. [Delegation Write Action Routes](feature-delegation-action-flows.md)
3. [Delegation Collection Management](feature-delegation-collection-management.md)
4. [Wallet Checker](feature-wallet-checker.md)
5. [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
6. [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)

## Features

### Routing and Entry

- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md): section routes, menu behavior, query-param carry rules, and fallback HTML behavior.

### Write and Management

- [Delegation Write Action Routes](feature-delegation-action-flows.md): write-route entry points, required fields, query-prefill behavior, and manager variants.
- [Delegation Collection Management](feature-delegation-collection-management.md): collection-scoped reads, row actions, manager actions, and lock controls.

### Diagnostics

- [Wallet Checker](feature-wallet-checker.md): read-only wallet diagnostics, deep-link behavior, and consolidation checks.

## Flows

- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md): start at Delegation Center, execute writes, then verify outcomes.

## Troubleshooting

- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md): not-found and fallback route issues, validation failures, manager-action gating, network mismatch, and Wallet Checker recovery.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
