# The Memes Mint Flow

## Overview

- `/the-memes/mint` is the mint route for the current latest The Memes drop.
- The page combines artwork, drop details, countdown status, recipient
  selection, phase-aware mint controls, and transaction status.
- On desktop, artwork aligns with the top of the drop details. On mobile,
  artwork appears above the details and mint controls.
- Video playback uses the drop's API-provided media URL when available, so
  mirrored videos load through the CDN. If that URL is missing, the page uses
  the animation URL from the artwork metadata.
- The same mint data and widget are also reused by the standalone latest-mint
  shell documented in
  [Standalone The Memes Mint Page](feature-standalone-mint-page.md).
- Submit is enabled only when the claim is active, a destination wallet is
  selected, and mint count is set.

## Location in the Site

- Route: `/the-memes/mint`
- Typical navigation path: `Mint` button on the Now Minting countdown card.

## Entry Points

- Open `/the-memes/mint` directly.
- Open a supported countdown card and select `Mint`.
- On iOS with country `US`, use `Mint on 6529.io` to open the same mint route
  in a browser tab.

## User Journey

1. User opens `/the-memes/mint`.
2. The page loads latest mint claim/instance data and shows
   `Retrieving Mint information`.
3. After load, users see artwork, drop details (`Distribution Plan`, edition
   size, mint price, status), countdown context, and mint controls.
4. A first-time visitor connects a wallet, then chooses either `Mint for me` or
   `Mint for fren`. If a remembered profile is active but its signer is
   disconnected, the separate connect control is hidden and `SEIZE xN` opens
   wallet connection when needed.
5. For `Mint for me`:
   - Recipient is the connected profile.
   - Connected wallet is selected by default.
   - If multiple profile wallets exist, user can pick a different destination
     wallet.
   - If only one profile wallet exists, wallet selection is fixed.
6. For `Mint for fren`:
   - Search by handle, ENS, or wallet.
   - Select recipient profile, then destination wallet.
7. User selects mint count.
   - Public phase: numeric input.
   - Allowlist phases: selectable up to available unminted spots.
8. User selects `SEIZE xN`. If the active profile's authorized wallet is not
   currently connected, the wallet connection dialog opens and the mint
   continues after the same wallet reconnects. Selecting another authenticated
   wallet switches the active profile, refreshes mint details, and cancels the
   pending mint so the user can review and select `SEIZE xN` again.
9. The transaction modal shows `Confirm in your wallet` and
   `Review the mint details and network fee before confirming.` It displays
   the artwork, collection and card number when available, `Quantity`, and the full
   destination address under `Recipient`. Review and confirm the request in
   the wallet. If the request is not visible, expand `Wallet not showing?` for
   help finding it in the wallet app or browser extension. Reject the request
   in the wallet to stop before submission.
10. Once submitted, the modal shows `Mint submitted` and
    `Waiting for network confirmation.` The artwork, quantity, and recipient
    remain visible. `This window updates automatically.` explains that no
    further action is needed here. `View transaction` opens the transaction in
    a new browser tab when its link is available.
11. After receipt confirmation, the modal headline becomes `SEIZED!`, followed
    by `Your mint is confirmed.` It shows the artwork, collection and card
    number when available, minted quantity, and the full destination wallet
    address under `Minted to`.
12. Select `Done` to close the confirmation and return to the mint page, or
    `View transaction` to open the transaction in a new browser tab. The close
    control and Escape also dismiss the confirmation.

## Common Scenarios

- Active public phase:
  - Mint controls appear after recipient selection.
  - Users can set mint count and see total ETH cost before submitting.
- Active allowlist phase:
  - The panel shows `Allowlist Spots`, plus `Minted` and `Available Mints`.
  - Mint count is selected from available spots.
- Project description panel:
  - The mint NFT description initially shows as a 3-line preview.
  - The `+ SHOW MORE` button appears only when the description exceeds that
    preview.
  - Expanding with `+ SHOW MORE` reveals the full description and changes the
    label to `- SHOW LESS`.
  - Collapsing again reuses `- SHOW LESS`/`+ SHOW MORE` to return to the preview.
- Reviewing phase windows:
  - Phase cards show `UPCOMING`, `ACTIVE`, or `COMPLETED` for each phase.
  - When one phase ends but a later phase still exists, the next phase becomes
    the highlighted upcoming card instead of finalizing the whole drop.
  - Time display can be switched between local timezone and UTC.
  - After a destination wallet is selected, each phase card can show
    `No eligible spots`, `x eligible spot(s)`, `Unlimited spots`,
    `Loading eligibility...`, or `Eligibility unavailable`.
- Airdrops summary:
  - If selected destination has airdrops, the phase area shows `Airdrops: xN`.
- Minting for another wallet:
  - `Mint for fren` enables recipient search by handle, ENS, or wallet.
  - Mint executes for the selected destination wallet.
  - Before confirmation, the full destination address appears under
    `Recipient` in both the wallet-request and submitted states.
  - The success confirmation shows the destination wallet under `Minted to`,
    so users can verify where the artwork was minted.
- Minting to your own profile wallet:
  - `Mint for me` uses the connected profile as the recipient profile.
  - If the profile has multiple wallets, users can switch to a different
    destination wallet.
  - If the profile has one wallet, wallet switching is not available and mint
    uses that wallet directly.
  - Switching from `Mint for fren` back to `Mint for me` clears fren selection
    and resets destination to the currently connected wallet.
- Not-yet-active phase:
  - Action button is disabled and shows `DROPS ... UTC`.
- Between mint phases:
  - When the active claim window ends but a later phase still exists, the page
    countdown switches to the next phase start instead of `Mint Complete`.
  - Mint actions stay unavailable until the next phase becomes active.
- Mint diagnostics:
  - Add `?mintdebug=1` to show `Mint diagnostics`.
  - `Copy` copies the diagnostics JSON payload.

## Edge Cases

- If an authorized wallet is not currently connected, selecting `SEIZE xN`
  opens wallet connection and continues the intended mint after connection.
  Closing the connection dialog cancels the pending mint without showing a
  transaction error.
- If a different already-authenticated wallet is selected, the app switches to
  that wallet's profile. Because recipient, eligibility, price, or transaction
  arguments may have changed, the old pending mint is cancelled and the user
  reviews the refreshed details before selecting `SEIZE xN` again.
- If the selected wallet is not authenticated, the normal authentication flow
  is required before it can become the connected profile.
- If transaction-relevant mint details change while wallet connection is open,
  the pending mint is cancelled so the user can review the updated details and
  retry instead of submitting stale inputs.
- On iOS:
  - Country `US`: shows `Mint on 6529.io` handoff button.
  - Non-`US` or unknown country: mint controls are hidden.
- `Mint for fren` search starts after 3 typed characters.
- If `Mint for fren` is selected without a recipient wallet, mint controls stay
  hidden until a wallet is selected.
- If no allowlist spots exist for the selected address, the panel shows
  `No spots in current phase for this address`.
- If allowlist proofs are not available for enough entries, minting stops with
  `No allowlist spots in current phase for this address`.
- If the minted asset description is short enough to fit in the preview, the
  expand/collapse button is not shown.
- If a wallet-request, submitted, or success modal cannot display the artwork
  image, it shows a placeholder labelled `Artwork preview unavailable`.
  Quantity and destination remain visible. The unavailable preview does not
  change the transaction status or prevent access to an available transaction
  link.
- The wallet-request, submitted, and success states retain the same artwork,
  quantity, and destination selected for that mint, even if the page's current
  mint details later change.
- Wallet confirmation and submitted states have no close or `Done` control,
  and Escape or clicking outside does not dismiss them. Before submission,
  stop by rejecting the request in the wallet. After submission, the modal
  waits for confirmation or an error.
- A submitted mint stays in `Mint submitted` while its receipt status updates;
  the modal does not ask for wallet confirmation again.
- Once claim status is ended/finalized, mint-connect and mint-action controls
  no longer render for the finished phase window.
- Mint action buttons become active at the exact phase start timestamp and stop
  being active at the exact phase end timestamp.
- When the current phase has ended but the drop still has a later phase, the
  countdown can still stay on the page while the action area waits for the next
  phase to start.
- Across Europe/Athens daylight-saving transitions, the UTC timestamps shown in
  the phase cards can move by one hour while phase wall-clock windows remain
  fixed.

## Failure and Recovery

- If mint-claim fetch fails, the page shows
  `Error fetching mint information`.
- If claim/instance data cannot be resolved after loading, the page shows
  `No mint information found`.
- If allowlist lookup fails, the panel shows `Error fetching allowlist data`.
- If the wallet request is not visible, expand `Wallet not showing?`, then
  open the wallet app or browser extension to find it. The help control
  reveals instructions; it does not open the wallet itself.
- If wallet signature/transaction submission fails, the on-chain transaction
  modal shows the mint error and can be closed before retrying.
- If receipt polling fails after submission, the modal shows the receipt error
  and transaction link when a hash is available.
- Users can retry by correcting recipient/count inputs, retrying wallet
  confirmation, or refreshing the page.

## Limitations / Notes

- `/the-memes/mint` always targets the current latest Memes mint, not an
  arbitrary card ID.
- Displayed mint status and phase timing follow on-chain/Manifold data and can
  lag by a few seconds.
- The default phase windows are anchored to Europe/Athens wall-clock times:
  - Phase 0: `17:40-18:20`
  - Phase 1: `18:30-18:50`
  - Phase 2: `19:00-19:20`
  - Public phase: `19:20-17:00` next day
- UTC/local rendering can shift by one hour across DST changes while Athens
  wall-clock windows remain fixed.
- Transaction success is shown after receipt confirmation, not immediately after
  wallet submission.
- For transaction errors, the modal identifies the card as
  `Mint: The Memes #{id}` when the on-chain claim provides a valid token ID;
  otherwise it keeps the generic `Mint The Memes` title.
- Wallet confirmation, submitted, and success states use the status as the
  title and place the card identifier with the artwork details. If the artwork
  title is unavailable, it uses `Artwork`; without a valid card number, the
  collection label remains `The Memes`.
- Debug diagnostics are only exposed when the `mintdebug=1` query parameter is
  set, and are intended for debugging support.

### Localization fallback debt

- Route or component: `/the-memes/mint`,
  `components/manifold-minting/ManifoldMintingWidget.tsx`, and the shared
  `components/common/OnchainTransactionModal.tsx` status surface.
- Untranslated surface: the remaining mint controls, phase/eligibility copy,
  inline validation, and the shared modal's error controls and accessible names.
- Current fallback behavior: wallet confirmation, wallet-request help,
  submitted status, and success confirmation support `en-US`, `en-GB`, `fr-FR`,
  `es-ES`, and `de-DE`, including artwork fallbacks and actions. `SEIZED!` and
  `The Memes` retain their brand wording in every locale. Mint error titles
  and status messages fall back to `en-US`; the remaining widget and shared
  error modal copy is still English-only.
- User impact: every supported locale has localized wallet-request, submitted,
  and success states, but untranslated mint controls and error details remain
  in English.
- Owner or follow-up issue: frontend minting localization backlog.
- Expected remediation path: extract the remaining mint widget and shared
  on-chain modal copy into complete message families, add reviewed translations,
  then verify wrapping, error recovery, and accessible names in every supported
  locale.

## Related Pages

- [Media Index](../README.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [Standalone The Memes Mint Page](feature-standalone-mint-page.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [Docs Home](../../README.md)
