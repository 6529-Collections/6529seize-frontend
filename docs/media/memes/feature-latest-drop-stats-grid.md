# Latest Drop Stats Grid

## Overview

On `/`, the `Latest Drop` panel includes a four-row stats grid for the current
Memes mint. The grid shows `Edition`, `Status`, `Mint price`, and `Floor`.

If the current mint is ended and next-drop data is available, home switches to
`Next Drop`; this grid is not shown in that state.

## Location in the Site

- Home `Latest Drop` panel: `/`

## Entry Points

- Open `/`.
- Wait for the home mint surface to load.
- Confirm home is showing `Latest Drop` (not `Next Drop`).
- Connect a profile to see the optional balance chip in `Edition`.

## User Journey

1. User opens `/` and reaches the mint feature panel on home.
2. While latest-drop and claim state are unresolved, the panel shows skeleton
   placeholders.
3. When `Latest Drop` renders, the details column shows `Edition`, `Status`,
   `Mint price`, and `Floor`.
4. `Edition` is read from claim totals:
   - Upcoming/active claim: minted and max values as `x/y`.
   - Finalized claim: minted total only as `x`.
5. `Status` resolves to `Upcoming`, `Active`, `Ended`, or `Sold Out`.
6. `Mint price` shows ETH for paid claims, otherwise `N/A`.
7. `Floor` shows the latest floor value in ETH, or `N/A` when unavailable.
8. If a profile is connected, a compact balance chip can appear beside
   `Edition`; its tooltip shows `SEIZED xN` or `UNSEIZED`.

## Common Scenarios

- Claim is upcoming:
  - `Edition` shows minted vs max as `x/y`.
  - `Status` shows `Upcoming`.
- Claim is active:
  - `Edition` stays `x/y` and updates with claim polling.
  - `Status` shows `Active`.
- Claim finalizes as sold out:
  - `Edition` switches from `x/y` to final minted total `x`.
  - `Status` shows `Sold Out`.
- Claim finalizes with unminted editions:
  - `Edition` still switches to final minted total `x`.
  - `Status` shows `Ended`.
- Signed-in collector:
  - `Edition` includes the balance chip with current count.
  - `0` balance still renders and resolves to `UNSEIZED` in the tooltip.

## Edge Cases

- During claim fetch, `Edition` can be blank while `Status` and `Mint price`
  show loading placeholders.
- `Floor` can still render while claim rows are unresolved because floor comes
  from latest-drop metadata, not claim data.
- If profile balance is still loading, the balance chip stays hidden.
- If no profile is connected, the balance chip does not render.
- If the balance request fails, the chip falls back to `0` with `UNSEIZED`
  tooltip text.
- If current mint is ended and a next drop is available, home switches to the
  `Next Drop` panel and this grid does not render.

## Failure and Recovery

- If claim data does not resolve, `Status` and `Mint price` can remain in
  loading-placeholder state and `Edition` can stay empty.
- If floor data is unavailable or `0`, `Floor` shows `N/A`.
- If latest-drop data is unavailable and no cached value exists, the home
  latest-drop surface can disappear until data is fetched again.
- Refreshing `/` retries latest-drop, claim, and balance queries.

## Limitations / Notes

- Stats are informational and do not grant mint permissions.
- Values depend on latest-drop and claim polling and can lag by a few seconds.
- Active claims refresh more frequently than non-active claims.
- `Edition` reflects claim totals for the current latest-drop mint, not a
  separate historical aggregate across all drops.

## Related Pages

- [Media Index](../README.md)
- [Memes Index](README.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [Docs Home](../../README.md)
