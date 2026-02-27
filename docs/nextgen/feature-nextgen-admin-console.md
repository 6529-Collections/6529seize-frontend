# NextGen Admin Console Access and Actions

Parent: [NextGen Index](README.md)

## Overview

The NextGen admin console route exposes role-gated contract operations for
Global, Collection, and Artist users.

## Location in the Site

- NextGen admin route: `/nextgen/manager`

## Entry Points

- Open `/nextgen/manager` directly.
- Switch focus via `?focus=global`, `?focus=collection`, or `?focus=artist`.

## User Journey

1. Open `/nextgen/manager`.
2. Connect a wallet if not connected.
3. Pick a focus area (`Global`, `Collection`, `Artist`).
4. Open an action card shown for the connected wallet role.
5. Fill inputs and submit on-chain actions in the selected module.
6. Review transaction status and inline error output in each module.

## Common Scenarios

- `Global` section exposes collection creation/airdrop, split/payment,
  admin-registration, and contract-level actions when permitted.
- `Collection` section exposes set-data/costs/phases and collection update
  actions when permitted.
- `Artist` section exposes collection signing and split proposal actions for
  artist wallets.

## Edge Cases

- Connected wallets without required privileges see role-blocking messages
  instead of action controls.
- `Artist` focus shows a dedicated restriction message for non-artist wallets.

## Failure and Recovery

- Reconnect with a wallet that has the needed role and refresh permissions.
- Resolve transaction/network errors reported by each admin module, then retry.

## Limitations / Notes

- This route is not linked from the main `/nextgen` navigation header.
- Action visibility is wallet-role dependent and can take time to resolve after
  wallet switches.

## Related Pages

- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
- [Docs Home](../README.md)
