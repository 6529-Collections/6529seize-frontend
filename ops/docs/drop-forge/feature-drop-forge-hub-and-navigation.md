# Drop Forge Hub and Section Navigation

## Overview

`/drop-forge` is the landing route for internal claim operations. It presents
two section cards:

- `Craft Claims`: prepare winning submissions for distribution
- `Launch Claims`: initialize claim phases, update claim config, and run
  airdrops

Below the cards, a static `Contract Admins` card shows the active chain and creator
contract, linked to Etherscan for that chain, then its owner first and deduplicated
on-chain admins. Each row puts its Owner/Admin pill above a mainnet ENS name and
full wallet address on one line when space allows, wrapping on narrow screens.
Missing, loading, or failed ENS lookups do not hide the address or list.
All landing-access wallets can read this list and refresh it. Craft access
remains distribution-admin-only.

## Contract Admin Changes

- Add/Revoke controls are shown only to the owner or `CLAIMS_ADMIN_WALLETS`.
  Other approved on-chain admins have Launch access but cannot manage admins.
- Add accepts a wallet address or ENS name resolved through the existing
  mainnet ENS input. Confirmation shows the exact resolved wallet address.
  Invalid/unresolved names, the zero address, owner, and existing admins cannot
  be added. Revoke requires confirmation and is never offered for the owner.
  Formatted ENS labels are forward-resolved, not trusted by their editable wallet
  suffix. Editing the name invalidates an unconfirmed operation; pending, failed,
  or missing resolution blocks Add rather than reusing the prior wallet.
- The header's `Add Admin` button unfolds an inline form above the list, without
  opening a separate input dialog. `Review Admin` opens the existing transaction
  review; `Cancel` closes and resets the form and returns focus to `Add Admin`.
  Refresh/Revoke use the shared app tooltips rather than native browser titles.
- Transactions call `approveAdmin(address)` or `revokeAdmin(address)` on the
  active creator contract, not the lazy-claim extension. The existing on-chain
  dialog shows wallet confirmation, submission, receipt, and error states.
  A successful receipt refreshes the list and shared creator permission reads.
- Only the contract owner can execute these methods on-chain. Configured
  claims admins intentionally see the controls for testing; non-owner calls
  still fail. Their pre-sign review explicitly warns that this wallet is not
  the owner and the transaction is expected to fail. No environment admin list
  or ownership is changed by these calls.
- On-chain reads refresh periodically and on refocus. A read failure shows a
  retry and disables writes rather than trusting an old list. A wallet/network
  change invalidates an unconfirmed operation; duplicate submissions are blocked.
- Manual Refresh displays a spinner and disables the refresh button for at least
  1.5 seconds, and until both owner/admin reads finish if they take longer. The
  visual minimum does not delay fresh list data or affect periodic refreshes.
- The chain follows existing Drop Forge configuration: Sepolia uses the
  testnet creator, other supported wallet contexts use the mainnet creator.
  Sepolia launch action tracking is still unsupported by the backend.

### Localization Fallback Debt

- Route/component: `/drop-forge`, `DropForgeContractAdmins` and its transaction hook.
- Untranslated surface: the `dropForge.admins.*` labels, accessible names,
  validation, warnings, and transaction-error messages. All are message-backed;
  other locale dictionaries currently fall back to the canonical en-US source.
- User impact: users selecting en-GB, fr-FR, es-ES, or de-DE still see English
  admin-management copy, without missing labels or errors.
- Owner: frontend Drop Forge maintainers (`6529seize-maintainers`).
- Remediation: translate `i18n/messages/drop-forge-admins.ts` keys into the four
  locale dictionaries and verify wrapping, keyboard focus, and screen-reader
  announcements on the authenticated admin surface in every supported locale.
  Existing Craft/Launch and shared transaction-dialog fallback debt is outside
  this admin-copy migration; transaction authority is unchanged.

## Location in the Site

- Route: `/drop-forge`
- Web and app sidebar row: `Drop Forge` after `About` (only when the connected
  wallet can access it)
- Header search page results: `Drop Forge`, and optionally `Craft Claims` and
  `Launch Claims`

## Entry Points

- Open `/drop-forge` directly.
- Select `Drop Forge` from the web or app sidebar.
- Open the route from header search page results.

## User Journey

1. Open `/drop-forge`.
2. The page checks the connected wallet's Drop Forge permissions.
3. If access is allowed, the page shows the `Drop Forge` title plus a
   `Testnet` indicator when the connected wallet is on Sepolia.
4. Review the two section cards:
   - `Craft Claims`
   - `Launch Claims`
5. Select one card to move into that queue.
6. If the current wallet can see the landing route but cannot open one of the
   sections, that card stays visible but disabled.

## Common Scenarios

- Distribution admin:
  - Can open the landing route.
  - Can open `Craft Claims`.
  - Cannot open `Launch Claims` unless that wallet also has launch access.
- Claims admin or Drop Forge admin:
  - Can open the landing route.
  - Can open `Launch Claims`.
  - Cannot open `Craft Claims` unless that wallet also has distribution-admin
    access.
- Search-driven entry:
  - Page search can take the user straight to `/drop-forge`,
    `/drop-forge/craft`, or `/drop-forge/launch` when those routes are allowed.

## Edge Cases

- If the wallet is disconnected, the page never reaches the landing cards and
  stays in permission fallback.
- If permissions are still loading, the route shows `Checking permissions...`
  instead of stale access decisions.
- Disabled section cards remain visible on the landing page when the wallet has
  partial Drop Forge access but not that specific section's permission.
- The landing page does not expose claim rows itself; it only links to the
  craft and launch queues.

## Failure and Recovery

- If access is denied after permission checks complete, the page shows
  `You have no power here` and redirects to `/` after 10 seconds.
- Reconnect with a different wallet or switch to a wallet with the required
  role, then reopen `/drop-forge`.
- If search or sidebar entry points are missing, open the route directly to
  confirm whether the current wallet has access.

## Limitations / Notes

- Drop Forge is wallet-gated; there is no public browse mode.
- Landing-route access is broader than section access. Seeing the hub does not
  guarantee access to both `Craft Claims` and `Launch Claims`.
- The `Testnet` indicator follows the currently connected chain, not a separate
  route toggle.

## Related Pages

- [Drop Forge Index](README.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)
- [Header Search Modal](../navigation/feature-header-search-modal.md)
- [Docs Home](../README.md)
