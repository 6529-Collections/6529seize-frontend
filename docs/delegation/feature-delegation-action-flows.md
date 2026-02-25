# Delegation Action Flows

## Overview

Delegation action routes handle delegation registration and management tasks
inside the Delegation Center route family.

## Location in the Site

- Route family: `/delegation/*`
- Common action routes:
  - `/delegation/register-delegation`
  - `/delegation/register-consolidation`
  - `/delegation/register-sub-delegation`
  - `/delegation/assign-primary-address`

## Entry Points

- Open `Delegation Center` and use action buttons on section cards.
- Open action routes directly with a `/delegation/<action-route>` URL.

## Known Behavior

- Action routes stay within the delegation route family and reuse the delegation
  shell/navigation.
- `register-delegation` can carry `collection` and `use_case` query parameters.
- `assign-primary-address` can carry the `address` query parameter.
- Users can move back to the `Delegation Center` route from action flows.

## Not Yet Documented

- TODO: Document required versus optional form fields for each action route.
- TODO: Document transaction confirmation states and user-visible completion
  messaging.
- TODO: Document action-level validation errors and recovery paths.
- TODO: Document detailed wallet-checker and assign-primary-address
  troubleshooting.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
