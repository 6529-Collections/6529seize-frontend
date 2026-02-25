# Now Minting Countdown

## Overview

The Now Minting countdown card shows the current mint phase timing and status
for The Memes drops. Depending on state, it shows one of four states: loading,
live/upcoming countdown, completion, or error.

## Location in the Site

- Home latest-drop section: `/`
- The Memes card page: `/the-memes/{id}` (shown when that card is the current
  final card in the collection)
- The Memes distribution page header: `/the-memes/{id}/distribution`
- The Memes mint page: `/the-memes/mint`

## Entry Points

- Open the home page and scroll to the latest-drop panel.
- Open a The Memes card URL directly.
- Open a The Memes distribution page from card navigation/links.
- Open the mint page from the countdown `Mint` button or direct URL.

## User Journey

1. User opens a supported page that renders the countdown card.
2. The card first shows a loading skeleton while mint claim data resolves.
3. The card then resolves into one of two UI modes:
   - Countdown mode for upcoming/live phases.
   - Status mode for sold out, finalized, or error states.
4. In countdown mode, users see phase text with `Starts In` or `Ends In` and a
   live-updating timer.
5. In countdown mode, the card can show a `Mint` button (depending on surface
   settings and platform/country rules) that links to `/the-memes/mint`.

## Common Scenarios

- Upcoming phase:
  - Header shows `... Starts In`
  - Status pill shows `Upcoming`
- Active phase:
  - Header shows `... Ends In`
  - Status pill shows `Live`
  - Timer updates continuously
- Allowlist phase:
  - Info icon appears beside status
  - Header uses phase-specific labels such as `Phase 0 (Allowlist) Starts In`
    and `Phase 1 (Allowlist) Ends In`
  - Tooltip explains that the timer is phase-specific and users should verify
    allowlist inclusion in the distribution plan
- Public phase:
  - Header uses `Public Phase Starts In` before activation and
    `Public Phase Ends In` after activation
- Sold out:
  - Card shows `Mint Complete` with `All editions have been minted!`
- Finalized (ended without full sell-out):
  - Card shows `Mint Complete` with `Minting for this drop has ended.`
  - This state appears when the mint window closes with editions still
    unminted.

## Edge Cases

- On `/the-memes/{id}`, this countdown is only shown for the current final card
  in the collection.
- On `/the-memes/{id}/distribution`, the completion card does not show the
  `Next drop ...` strip (same behavior for sold out/finalized/error status
  there).
- If a drop is both sold out and ended, users see the sold-out completion
  message (`All editions have been minted!`) rather than the finalized-ended
  message.
- On `/the-memes/mint`, the countdown card hides its own `Mint` button because
  the page already includes the mint widget/action flow.
- On iOS outside the US, the countdown card hides the `Mint` button.
- On home, if the current mint is ended and next-drop data exists, the latest
  section switches to a `Next Drop` panel instead of showing this countdown.
  If the drop sells out before the scheduled end time, the countdown surface
  stays in place and shows the sold-out status card until end-time status
  changes.
- At the exact phase start timestamp, the state changes from `Upcoming` to
  `Live`; at the exact phase end timestamp, it leaves the active countdown.
- During Europe/Athens daylight-saving transitions, UTC/local countdown values
  can shift by one hour while phase wall-clock targets stay fixed to Athens
  windows.

## Failure and Recovery

- If mint claim data fails to load, the card shows:
  `Error fetching mint information. Please try again later.`
- Error state does not show the `Next drop` strip.
- Refreshing or reopening the page retries mint-claim fetches.
- While data is still loading, users see skeleton placeholders instead of stale
  timing values.

## Limitations / Notes

- Timing and phase labels are based on Manifold claim data and periodic polling,
  so visible updates can lag a few seconds.
- The Memes phase schedule is anchored to Europe/Athens wall-clock windows
  (Phase 0 `17:40-18:20`, Phase 1 `18:30-18:50`, Phase 2 `19:00-19:20`,
  Public `19:20` to `17:00` next day), then resolved per claim window and
  rendered from claim timestamps.
- The countdown card is informational; wallet eligibility and successful minting
  are enforced in the mint widget flow.
- The `Mint` button always routes to `/the-memes/mint`.

## Related Pages

- [Media Index](README.md)
- [The Memes Mint Flow](feature-the-memes-mint-flow.md)
- [Memes Minting Calendar](feature-memes-minting-calendar.md)
- [NFT Media Source Fallbacks](feature-nft-media-source-fallbacks.md)
- [NFT Balance Indicators](feature-nft-balance-indicators.md)
- [Docs Home](../README.md)
