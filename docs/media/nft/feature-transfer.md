# NFT Transfer

## Overview

Users can transfer NFTs from:

- `/{user}/collected` with batch selection and a sticky transfer panel.
- Single-token detail pages for The Memes, Meme Lab, 6529 Gradient, and NextGen.

Both paths use the same recipient picker and on-chain submission modal.

## Location in the Site

- Collected batch transfer: `/{user}/collected`
- The Memes detail (`Your Cards`): `/the-memes/{id}`
- Meme Lab detail (`Your Cards`): `/meme-lab/{id}`
- 6529 Gradient detail: `/6529-gradient/{id}`
- NextGen token detail: `/nextgen/token/{token}` and `/nextgen/token/{token}/{view}`

## Entry Points

- In `/{user}/collected`, click `Transfer` in the filter row.
- On supported detail pages, use the local `Transfer` block.
- In collected transfer mode, click `Continue` in the sticky panel to open modal review.

## Availability Rules

- Collected transfer mode shows only when all are true:
  - desktop view,
  - connected wallet matches one wallet on the viewed profile,
  - current collected view has cards.
- Collected `Network` mode does not expose transfer mode.
- Single-token transfer controls show only for owner context:
  - The Memes and Meme Lab: `Your Cards` with connected-wallet balance.
  - 6529 Gradient and NextGen: connected wallet is the current token owner.
- Single-token transfer controls are hidden on mobile devices.

## User Journey

### Batch Transfer (`/{user}/collected`)

1. Click `Transfer` to enter transfer mode.
2. Card links switch to selection mode.
  - Selectable cards show a plus control.
  - Non-transferable cards show `Not owned by your connected wallet`.
  - While wallet-scoped balances load, those cards can show `Loading`.
3. For ERC-1155 cards, adjust quantity up to connected-wallet balance.
4. Use the sticky bottom panel:
  - Review item count.
  - Expand for per-item quantity changes and removal.
  - Click `Continue` to open modal review.
5. In modal review:
  - Left side shows selected NFTs and quantities.
  - Recipient search supports handle, ENS, or wallet.
  - Search starts at 3+ characters.
  - Single-wallet recipient profiles can auto-select that wallet.
  - `Transfer` stays disabled until a destination wallet is selected.
6. Click `Transfer` to submit.
  - Status rows progress through `Pending`, `Approve in your wallet`,
    `Submitted`, and `Successful`/`Error`.
  - `View Tx` links appear when chain explorer data is available.
7. Keep the modal open during approvals/confirmation.
  - While transactions are pending, close actions are disabled.
8. After all rows settle, close the modal:
  - At least one success: selections are cleared and transfer mode exits.
  - All errors: selections remain so you can retry.

### Single-Token Transfer (Detail Pages)

1. Open a supported detail page and use the local `Transfer` block.
2. For ERC-1155 detail pages, set quantity before submission.
3. Continue through the same modal recipient and transaction flow.

## Common Scenarios

- Move multiple NFTs from one collected profile view to one destination wallet.
- Send partial ERC-1155 quantities from The Memes or Meme Lab detail pages.
- Find recipient by handle/ENS/wallet, then choose one destination wallet.
- Enter an exact wallet or `.eth`; when there is one match, profile/wallet selection can auto-fill.
- Retry quickly after a fully failed batch without rebuilding selection.

## Edge Cases

- Collected transfer mode can show cards that are not transferable by the connected wallet.
- Connected-profile counts and connected-wallet transferable counts can differ.
- If connected wallet disconnects during collected transfer mode, transfer mode and selections are cleared.
- `Continue` is unavailable until at least one item is selected.
- Recipient search with fewer than 3 characters shows a typing prompt instead of results.

## Failure and Recovery

- Missing or invalid destination wallet returns `Invalid destination wallet` before signing.
- Missing client/wallet readiness returns `Client not ready` or `Wallet not ready`; reconnect and retry.
- Rejected/simulated/on-chain failures mark row status as `Error` with failure text.
- For partial success, close and start a new transfer for remaining items.

## Limitations / Notes

- Transfers are signed by the connected wallet only.
- ERC-721 transfers submit one transaction per token.
- ERC-1155 transfers batch by contract/origin group where possible.
- Recipient search resolves profile first, then destination wallet selection.
- Transfers are irreversible once submitted on-chain.

## Related Pages

- [Collected Tab and Transfer Controls](../../profiles/tabs/feature-collected-tab.md)
- [Profiles Index](../../profiles/README.md)
- [Media Index](../README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [NextGen Token View](../../nextgen/feature-token-media-rendering.md)
