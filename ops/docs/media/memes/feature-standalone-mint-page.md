# Standalone The Memes Mint Page

## Overview

- The standalone mint page is an external latest-mint shell for The Memes,
  typically deployed at `https://thememes.6529.io/` and test hosts such as
  `https://thememestest.6529.io/`.
- It reuses the current latest-mint data and mint widget from the main app, but
  moves wallet connection into a compact top bar and keeps outbound navigation
  focused on `6529.io`.
- The page shows the current mint artwork, artist, description, countdown,
  mint controls, phase cards, and distribution-plan access.

## Location in the Site

- External standalone hosts:
  `https://thememes.6529.io/` and environment-specific equivalents

## Entry Points

- Open the standalone host directly.
- Open a deployment-specific test host directly when support shares it.
- Follow any external campaign or share link that points at the standalone
  mint host.

## User Journey

1. User opens the standalone host.
2. The page shows a top bar with `The Memes by 6529 - Mint Page` plus a wallet
   connect/balance control.
3. While mint data loads, the page shows `Retrieving Mint information`.
4. After load, the page shows the current latest mint artwork, title,
   collection/card number, artist, description, edition size, countdown, mint
   widget, and phase cards.
5. The top bar wallet control supports `Connect Wallet`, then shows ENS or a
   shortened address, token balance, and a disconnect action.
6. Artist profile links open the matching `6529.io/{handle}` page in a new tab.
7. `Distribution Plan` opens the matching `6529.io/the-memes/{id}/distribution`
   page in a new tab.

## Common Scenarios

- Disconnected visitor:
  - The top bar shows `Connect Wallet`.
  - The mint widget does not render an extra inline connect block.
- Connected collector:
  - The top bar shows the connected ENS/address and current balance.
  - Minting continues inside the standalone shell after wallet connection.
- Load failure:
  - The page centers a `Something went wrong` status card with the returned
    fetch error or a generic mint-information message.
- No current mint available:
  - The page centers `No mint information found`.
- External navigation:
  - Artist and distribution-plan links leave the shell by opening `6529.io` in
    a new tab instead of navigating in place.

## Edge Cases

- The standalone host always targets the current latest Memes mint, not an
  arbitrary historic card.
- The same latest-mint API and on-chain claim data drive both the standalone
  shell and `/the-memes/mint`, so both surfaces can show the same loading,
  sold-out, between-phase, or no-data states.
- The standalone page is a static export, but mint status, countdown timing,
  and wallet state still depend on live API and chain reads after load.

## Failure and Recovery

- If the page shows `Something went wrong`, refresh the standalone host and
  retry after the latest mint APIs recover.
- If the page shows `No mint information found`, retry later or confirm the
  current drop is still active on the main `6529.io` media routes.
- If outbound links do not open, retry from the visible artist or
  `Distribution Plan` link and allow the browser to open a new tab.

## Limitations / Notes

- The standalone shell is optimized for the current mint only; it does not
  replace the full browse/detail route family on `6529.io`.
- Outbound navigation is intentionally externalized so the shell stays focused
  on minting instead of in-app route transitions.

## Related Pages

- [Memes Index](README.md)
- [The Memes Mint Flow](feature-mint-flow.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [Docs Home](../../README.md)
