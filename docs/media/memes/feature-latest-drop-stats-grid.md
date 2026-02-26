# Latest Drop Stats Grid

## Overview

The home `Latest Drop` panel includes a four-row stats grid that summarizes the
current drop's edition progress, mint status, mint price, and floor price.

## Location in the Site

- Home latest-drop panel: `/`

## Entry Points

- Open `/` and scroll to `Latest Drop`.
- Wait for latest-drop data to load.
- Connect a profile to see the optional balance chip in the `Edition` row.

## User Journey

1. User opens `/` and reaches the `Latest Drop` panel.
2. While the panel is loading, the section renders placeholders.
3. Once loaded, the details column shows `Edition`, `Status`, `Mint price`, and
   `Floor`.
4. The `Edition` value resolves from the active claim:
   - Upcoming/live claim: minted and max values as `x/y`.
   - Finalized claim: minted total only as `x`.
5. The `Status` value resolves to `Upcoming`, `Active`, `Ended`, or `Sold Out`.
6. `Mint price` shows ETH value for paid claims, otherwise `N/A`.
7. `Floor` shows the latest floor value in ETH, otherwise `N/A`.
8. If signed in, a compact balance chip appears beside `Edition` and shows a
   tooltip with `SEIZED xN` or `UNSEIZED`.

## Common Scenarios

- Claim is upcoming:
  - `Edition` shows current minted vs max as `x/y`.
  - `Status` shows `Upcoming`.
- Claim is active:
  - `Edition` continues as `x/y` and updates with claim polling.
  - `Status` shows `Active`.
- Claim finalizes as sold out:
  - `Edition` switches from `x/y` to final minted total `x`.
  - `Status` shows `Sold Out`.
- Claim finalizes with unminted editions:
  - `Edition` still switches to final minted total `x`.
  - `Status` shows `Ended`.
- Signed-in collector:
  - `Edition` includes a compact balance chip beside the edition count.

## Edge Cases

- During initial claim fetch, the `Edition` value can render empty briefly while
  `Status` and `Mint price` show loading placeholders.
- If profile balance data is still loading, the balance chip stays hidden.
- If no profile is connected, the balance chip does not render.
- Large edition values use comma separators while staying in compact `x/y` (or
  `x`) form.

## Failure and Recovery

- If claim data fails to resolve, `Status` and `Mint price` remain in loading
  placeholder state and `Edition` stays empty until claim data is available.
- If floor data is unavailable or zero, the `Floor` row shows `N/A`.
- Refreshing `/` retries latest-drop and claim queries.

## Limitations / Notes

- Stats are informational and do not grant mint permissions.
- Values depend on current latest-drop and claim polling and can lag by a few
  seconds.
- `Edition` reflects claim totals for the current latest-drop mint, not a
  separate historical aggregate across all drops.

## Related Pages

- [Media Index](../README.md)
- [Memes Index](README.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [Docs Home](../../README.md)
