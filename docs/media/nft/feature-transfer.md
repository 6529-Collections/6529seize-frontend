# NFT Transfer

## Overview

Users can move owned NFTs to another wallet from two contexts:

- The profile collected tab (`/{user}/collected`) supports batch selection and
  a persistent transfer panel.
- Single-card detail pages for The Memes, Meme Lab, and NextGen expose one-card
  transfer controls.

The flow uses a recipient search first (handle, ENS, or wallet), then wallet
confirmation and on-chain execution.

## Location in the Site

- Collected tab bulk transfer: `/{user}/collected`
- The Memes detail card: `/the-memes/{id}`
- Meme Lab detail card: `/meme-lab/{id}`
- NextGen token detail: `/nextgen/token/{id}`

## Entry Points

- Open a collected profile tab and choose `Transfer`.
- Open a supported card detail page, then use the local `Transfer` action block.
- Open transfer modal with a prepared selection from the collected tab sticky panel.

## User Journey

1. In the collected tab, open transfer mode by clicking `Transfer` in the tab
   controls (desktop only).
2. In transfer mode, each transferable card can be selected:
   - The selection control is unavailable for cards with zero transfer balance in
     the connected wallet.
   - ERC-1155 cards allow quantity selection up to the connected-wallet balance.
3. Review selections in the sticky bottom transfer panel:
   - Expand the panel for per-item counts and thumbnails.
   - Cancel removes all selections and exits transfer mode.
4. Press `Continue` to open the transfer modal.
5. In the modal:
   - Select a recipient profile or wallet.
   - If a recipient profile has only one wallet, that wallet can be selected
     automatically.
   - You can change the recipient before confirming.
6. Press `Transfer` to submit transactions:
   - Recipient eligibility and destination wallet are validated first.
   - Each transfer is listed with status as it moves from pending to
     approval, submission, and final result.
7. Keep the tab open while approvals/signatures and on-chain confirmations
   complete.

For single-token pages, users usually transfer one card/asset at a time with:

- A quantity control when ERC-1155 copy-count applies.
- The same recipient picker and modal transaction path used by bulk mode.

## Common Scenarios

- Transfer a full collection of cards from `/{user}/collected` in one action.
- Select multiple ERC-1155 cards and transfer mixed quantities with a single modal
  confirmation.
- Use profile/ENS/wallet search to find recipients:
  - Search text shorter than 3 characters shows a prompt to continue typing.
  - Exact wallet or `.eth` query can auto-select matching identity and jump to that
    profile's wallet list.
- Transfer from a card detail page:
  - On The Memes and Meme Lab, transfer controls appear in the “Your Cards” area
    when the connected profile owns editions.
  - On NextGen pages, transfer control appears for owner-owned tokens.

## Edge Cases

- Transfer mode is not shown on mobile in the collected tab and not shown for
  users who are not connected to a wallet.
- Transfer mode is hidden unless the viewed profile includes the connected wallet
  and the page has transferable cards.
- A card can show an explicit “not owned” indicator in transfer mode if the
  connected-wallet balance is zero.
- If connected wallet data is still loading, some cards can display a transient
  loading marker while transferable balances are resolving.
- The collected page loads transfer eligibility from a separate wallet-scoped query,
  so there can be a short delay before selections become fully usable.

## Failure and Recovery

- If no valid recipient wallet is chosen, transfer submission fails with a clear
  destination-wallet error before signing.
- If a wallet connector is unavailable, modal submission fails with client-ready
  messaging and users can retry after reconnecting.
- If a transaction is rejected or fails on-chain, status is shown per item as
  `error` with the specific failure reason text available from the wallet/API
  layer (for example revert details for batched ERC-1155 transfers).
- For in-flight transfers, users can:
  - Keep the modal open while waiting for signatures and confirmations.
  - Note that the page warns transfers are irreversible before signing.
  - Close and reopen transfer mode to prepare another transfer after resolving
    blockers.

## Limitations / Notes

- NextGen and detail-page transfer controls are only shown to owners of the current
  asset in connected-wallet context.
- Bulk transfer supports:
  - ERC-721 one-by-one transfer entries.
  - ERC-1155 batching by origin group where possible, while still preserving one
    status row per grouped submission.
- Recipient search uses server-side profile lookup and wallet profile resolution to
  support profile/ENS/wallet discovery in one flow.
- Destination wallet identifiers are validated before signing, and wallet
  signature prompts are controlled by the wallet provider.
- Transaction links are available after submission when network explorer info exists.

## Related Pages

- [Collected Tab and Transfer Controls](../../profiles/tabs/feature-collected-tab.md)
- [Profiles Index](../../profiles/README.md)
- [Media Index](../README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [NextGen Token View](../../nextgen/feature-token-media-rendering.md)
