# The Memes Mint Flow

## Overview

- `/the-memes/mint` is the mint route for the current latest The Memes drop.
- The page combines artwork, drop details, countdown status, recipient
  selection, phase-aware mint controls, and transaction status.
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
4. User connects a wallet (if not already connected), then chooses either
   `Mint for me` or `Mint for fren`.
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
8. User selects `SEIZE xN` and confirms in wallet.
9. While the transaction is in-flight, the page shows
   `Confirm in your wallet ...`, then
   `Transaction Submitted - SEIZING ...` with a `view trx` link.
10. After confirmation, the status updates to `SEIZED!` with the same
   transaction link.

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
  - Time display can be switched between local timezone and UTC.
- Airdrops summary:
  - If selected destination has airdrops, the phase area shows `Airdrops: xN`.
- Minting for another wallet:
  - `Mint for fren` enables recipient search by handle, ENS, or wallet.
  - Mint executes for the selected destination wallet.
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
- Mint diagnostics:
  - Add `?mintdebug=1` to show `Mint diagnostics`.
  - `Copy` copies the diagnostics JSON payload.

## Edge Cases

- If no wallet is connected, mint actions are replaced with wallet connect UI.
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
- Once claim status is ended/finalized, mint-connect and mint-action controls
  no longer render.
- Mint action buttons become active at the exact phase start timestamp and stop
  being active at the exact phase end timestamp.
- Across Europe/Athens daylight-saving transitions, the UTC timestamps shown in
  the phase cards can move by one hour while phase wall-clock windows remain
  fixed.

## Failure and Recovery

- If mint-claim fetch fails, the page shows
  `Error fetching mint information`.
- If claim/instance data cannot be resolved after loading, the page shows
  `No mint information found`.
- If allowlist lookup fails, the panel shows `Error fetching allowlist data`.
- If wallet signature/transaction submission fails, the mint error message is
  shown inline under the action button.
- If receipt polling fails after submission, the receipt error is shown inline.
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
- Debug diagnostics are only exposed when the `mintdebug=1` query parameter is
  set, and are intended for debugging support.

## Related Pages

- [Media Index](../README.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [Docs Home](../../README.md)
