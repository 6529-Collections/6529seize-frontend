# The Memes Mint Flow

## Overview

The Memes mint flow is the interactive mint surface at `/the-memes/mint`. It
combines recipient selection, phase-aware mint controls, wallet confirmation,
and on-chain transaction status updates for the current drop.

## Location in the Site

- Route: `/the-memes/mint`
- Typical navigation path: `Mint` button on the Now Minting countdown card.

## Entry Points

- Open `/the-memes/mint` directly.
- Open a supported countdown card and select `Mint`.
- On iOS in the US, open the `Mint on 6529.io` handoff button to continue in a
  browser context that supports minting.

## User Journey

1. User opens `/the-memes/mint`.
2. The page loads the latest Memes mint and shows `Retrieving Mint information`
   while claim/instance data is fetched.
3. After load, users see drop details, countdown context, and the mint action
   module.
4. The lower phase cards show `Phase 0`, `Phase 1`, `Phase 2`, and
   `Public Phase` with expected start/end windows and status badges.
5. User connects a wallet (if not already connected), then chooses either
   `Mint for me` or `Mint for fren`.
6. User selects a recipient wallet and mint count.
7. User selects `SEIZE xN` and confirms in wallet.
8. While the transaction is in-flight, the page shows
   `Transaction Submitted - SEIZING ...` with a `view trx` link.
9. After confirmation, the status updates to `SEIZED!` with the same
   transaction link.

## Common Scenarios

- Active public phase:
  - Mint controls appear after recipient selection.
  - Users can set mint count and see total ETH cost before submitting.
- Active allowlist phase:
  - The panel shows `Allowlist Spots`, plus `Minted` and `Available Mints`.
  - Mint count is selected from available spots.
- Reviewing phase windows:
  - Phase cards show `UPCOMING`, `ACTIVE`, or `COMPLETED` for each phase.
  - Time display can be switched between local timezone and UTC.
- Minting for another wallet:
  - `Mint for fren` enables recipient search by handle, ENS, or wallet.
  - Mint executes for the selected destination wallet.
- Not-yet-active phase:
  - Action button is disabled and shows `DROPS ... UTC`.

## Edge Cases

- If no wallet is connected, mint actions are replaced with wallet connect UI.
- On iOS outside the US, mint controls are not shown.
- On iOS in the US, minting is routed through the `Mint on 6529.io` button.
- If `Mint for fren` is selected without a recipient wallet, mint controls stay
  hidden until a wallet is selected.
- If no allowlist spots exist for the selected address, the panel shows
  `No spots in current phase for this address`.
- Once claim status is ended/finalized, mint-connect and mint-action controls
  no longer render.
- Mint action buttons become active at the exact phase start timestamp and stop
  being active at the exact phase end timestamp.
- Across Europe/Athens daylight-saving transitions, the UTC timestamps shown in
  the phase cards can move by one hour while phase wall-clock windows remain
  fixed.

## Failure and Recovery

- If mint claim/instance data fetch fails, the page shows
  `Error fetching mint information`.
- If claim/instance data cannot be resolved, the page shows
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
  `17:40`, `18:30`, `19:00`, `19:20`, then `17:00` next day for public-phase
  end; phase boundaries are computed from the active claim window and rendered
  as local time or UTC based on the toggle.
- Transaction success is shown after receipt confirmation, not immediately after
  wallet submission.

## Related Pages

- [Media Index](../README.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [Docs Home](../../README.md)
