# NFT Transfer

## Overview

- Transfer lets an owner send NFTs to one destination wallet.
- Two entry paths:
  - batch transfer from `/{user}/collected` (desktop),
  - single-token transfer blocks on supported detail routes.
- Both paths use the same recipient picker and on-chain status modal.

## Location in the Site

- `/{user}/collected` (batch transfer mode)
- `/the-memes/{id}` when `focus=your-cards`
- `/meme-lab/{id}` when `focus=your-cards`
- `/6529-gradient/{id}`
- `/nextgen/token/{token}` and `/nextgen/token/{token}/{view}` (`About` view only)

## Entry Points

- On `/{user}/collected`, click `Transfer` in the filter row.
- On supported detail pages, use the local `Transfer` block.
- If disconnected, transfer opens wallet connect first, then continues into transfer mode/modal after connection.

## Availability Rules

- Batch transfer on `/{user}/collected` shows only when all are true:
  - viewport is not mobile (`window.innerWidth > 750`),
  - connected wallet matches at least one wallet on the viewed profile,
  - current collected native-card result has at least one card.
- Batch transfer selection is for native collected cards. Network cards are not selectable.
- Single-token transfer blocks show only for owner context:
  - The Memes and Meme Lab: `Your Cards` tab with owned balance.
  - 6529 Gradient: connected wallet equals token owner.
  - NextGen token: connected wallet equals token owner, and current token view is `About`.
- Single-token transfer blocks are hidden on mobile devices.

## User Journey

### Batch Transfer (`/{user}/collected`)

1. Click `Transfer` to enter transfer mode.
2. Card tiles switch from link navigation to selection behavior.
  - Selectable cards show a plus control.
  - Non-transferable cards show `Not owned by your connected wallet`.
  - While transferable balances are loading, card overlays can show `Loading`.
3. For ERC-1155 cards, set quantity up to connected-wallet transferable balance.
4. Use the sticky bottom panel to:
  - review selected count,
  - expand item list for per-item quantity edits and removal,
  - click `Continue` to open modal review,
  - click `Cancel` to clear selections and exit transfer mode.
5. In modal review:
  - left column lists selected NFTs and quantities,
  - recipient search supports handle, ENS, or wallet input,
  - search runs at 3+ characters,
  - exact wallet/ENS input with one resolved result can auto-select profile and wallet,
  - profiles with one wallet can auto-select that wallet,
  - `Transfer` stays disabled until a destination wallet is selected.
6. Click `Transfer` to submit.
  - Rows progress through `Pending`, `Approve in your wallet`,
    `Submitted — waiting for confirmation`, and `Successful` or `Error`.
  - `View Tx` links show when explorer URLs are available.
7. Keep modal open during signing and confirmations.
  - While any transaction is pending/submitted, close actions are disabled.
8. After all rows settle, click `Close`.
  - At least one success: selected items are cleared and collected transfer mode exits.
  - All errors: selections stay so you can retry quickly.

### Single-Token Transfer (Detail Pages)

1. Open a supported token detail page and use the local `Transfer` block.
2. For ERC-1155 tokens (The Memes, Meme Lab), adjust quantity before submission.
3. Submit through the same recipient and transaction-status modal flow.

## Common Scenarios

- Move mixed NFTs from one collected profile view to one destination wallet.
- Send partial ERC-1155 quantities from The Memes or Meme Lab detail pages.
- Start transfer while disconnected, connect wallet, then continue without re-opening flow.
- Enter an exact wallet or `.eth` value and auto-fill recipient when one match is returned.
- Retry a fully failed batch without rebuilding selections.

## Edge Cases

- In transfer mode, profile-owned quantity and connected-wallet transferable quantity can differ.
- Some cards can be selectable while others stay blocked in the same view.
- If connected wallet disconnects during collected transfer mode, transfer mode and selections are cleared.
- `Continue` is unavailable until at least one item is selected.
- Recipient search with fewer than 3 characters shows a typing prompt instead of results.

## Failure and Recovery

- Missing client or wallet readiness returns:
  - `Client not ready. Please reconnect.`
  - `Wallet not ready. Please reconnect.`
  - `Wallet does not support writeContract.`
- Missing or invalid destination wallet returns `Invalid destination wallet. Please choose another wallet.`
- Simulation failures, user rejection, or on-chain failures mark rows as `Error` with row-level details.
- For partial success, close the modal and start a new transfer for remaining items.

## Limitations / Notes

- Transfers are signed by the connected wallet only.
- One submission targets one destination wallet.
- ERC-721 transfers submit one transaction per token.
- ERC-1155 transfers batch by contract and origin group where possible.
- Transfers are irreversible once submitted on-chain.

## Related Pages

- [Media NFT Index](README.md)
- [Collected Tab and Transfer Controls](../../profiles/tabs/feature-collected-tab.md)
- [Profiles Index](../../profiles/README.md)
- [Media Index](../README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [NextGen Token View](../../nextgen/feature-token-media-rendering.md)
