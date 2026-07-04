# Wave Leaderboard Sort and Price Filters

## Overview

Use leaderboard header filters to:
- reorder drops with `Sort`
- narrow curation-wave results with ETH bounds from `Filters`

`Sort` is saved per wave in local browser storage. Price filters are local-only
UI state.

## Location in the Site

- `Leaderboard` tab header on `/waves/{waveId}`.
- `Leaderboard` tab header on `/messages/{waveId}`.
- Legacy wave links (`/waves?wave={waveId}`) redirect to `/waves/{waveId}` and
  keep other query params. Price-query params are ignored by leaderboard header
  state.

## Entry Points

- Open `/waves/{waveId}` and switch to `Leaderboard`.
- Open `/messages/{waveId}` and switch to `Leaderboard`.
- Change `Sort`.
- In curation waves, open `Filters` and set `Minimum ETH` and/or `Maximum ETH`.

## Control Behavior

- `Sort` is always visible in the leaderboard header.
- On wider layouts, `Sort` uses compact pill tabs instead of a dropdown.
- `Sort` options are:
  - all waves: `Current Vote`, `Hot`, `Newest`
  - waves with `time_lock_ms`: `Projected Vote`
  - curation waves only: `Price`
- In tab layout, the active sort stays filled and brighter than the inactive
  options so the current mode remains easy to scan.
- Inactive sort tabs keep a darker filled background and brighten on hover
  before selection.
- In curation waves, `Filters` toggles a panel with `Minimum ETH` and
  `Maximum ETH` inputs.
- Price changes commit on `Enter`, on input blur, or after a short typing pause.
- `Clear filters` resets both price bounds.
- On narrow layouts, curation action controls can switch to compact icon mode
  and can move beside the price inputs when wrapping is needed.
- Header layout is width-based:
  - tries view-mode tabs + `Sort` tabs
  - falls back to `Sort` dropdown
  - enables horizontal control-row scroll if dropdown layout does not fit

## User Journey

1. Open `Leaderboard`.
2. Pick a `Sort` mode.
3. Optional (curation waves): open `Filters` and set min/max ETH bounds.
4. Compare results in the current leaderboard view mode.

## Edge Cases

- Some sort/price combinations validly return empty results.
- URL `min_price` and `max_price` values are not used by leaderboard header UI.
- If both price bounds are set in reverse order (`min > max`), request bounds
  are normalized before fetch.
- If a saved sort is `Projected Vote` but the wave has no `time_lock_ms`, the
  leaderboard resets that wave's saved sort to `Current Vote`.

## Failure and Recovery

- Any sort or price change triggers a fresh leaderboard query.
- If controls are clipped on small widths, scroll the controls row horizontally.
- If price filtering looks wrong, use `Clear filters` to reset ETH bounds.

## Limitations / Notes

- Sort and price changes only affect leaderboard presentation.
- Sort preference is local per wave and browser, and is not part of the URL.
- Price filters are not URL-synced and reset with wave-context remounts
  (for example changing to another wave thread).
- Curation price filtering uses ETH values.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Waves Index](../README.md)
- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
