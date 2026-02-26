# Delegation Center to Onchain Actions

## Overview

This flow covers the common delegation journey from entering Delegation Center
to executing writes and validating outcomes.

## Location in the Site

- `/delegation/delegation-center`
- `/delegation/register-*`
- `/delegation/assign-primary-address`
- `/delegation/<collection-route>`
- `/delegation/wallet-checker`

## Entry Points

- Sidebar: `Tools -> NFT Delegation -> Delegation Center`
- Direct URLs to action or collection routes

## User Journey

1. Open `/delegation/delegation-center`.
2. Choose one path:
   - action card (`Delegation`, `Consolidation`, `Delegation Management`)
   - collection card (`Any Collection`, `The Memes`, `Meme Lab`,
     `6529Gradient`)
3. Complete form input or choose existing row actions (`Edit`, `Revoke`,
   `Batch Revoke`, lock/unlock).
4. Submit and confirm in wallet.
5. Wait for success toast confirmation.
6. Optionally open `/delegation/wallet-checker` to verify resulting state.

## Common Scenarios

- Register delegation with optional expiry/token constraints.
- Register consolidation, then assign primary address.
- Use sub-delegation incoming-row selection to execute manager-driven actions
  for an original delegator.
- Revoke stale outgoing delegations in batch (2-5 rows).

## Edge Cases

- Starting delegation-center action cards while disconnected opens wallet
  connect before route transition completes.
- Query params persist only on matching routes (`address`, `collection`,
  `use_case`); switching sections clears unrelated params.
- Nested delegation FAQ routes render via HTML fallback path handling.

## Failure and Recovery

- Validation failures keep users on form and show inline errors.
- Wrong-network writes require chain switch and retry.
- Missing consolidation blocks primary-address assignment until consolidation
  exists.

## Limitations / Notes

- Final state depends on onchain confirmation timing.
- Route-level behavior differs between read-only checker and write-capable
  action forms.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Action Routes and Collection Management](feature-delegation-action-flows.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
