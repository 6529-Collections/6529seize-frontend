# Wave Leaderboard Sort, Group, and Price Filters

## Overview

Use leaderboard header filters to:
- reorder drops with `Sort`
- filter to one curation `Group` when groups exist
- narrow curation-wave results with ETH bounds from `Filters`

`Sort` is saved per wave in local browser storage. `Group` is URL-synced with
`curated_by_group={groupId}`. Price filters are local-only UI state.

## Location in the Site

- `Leaderboard` tab header on `/waves/{waveId}`.
- `Leaderboard` tab header on `/messages?wave={waveId}`.
- Legacy wave links (`/waves?wave={waveId}`) redirect to `/waves/{waveId}` and
  keep other query params, including `curated_by_group` (price-query params are
  ignored by leaderboard header state).

## Entry Points

- Open `/waves/{waveId}` and switch to `Leaderboard`.
- Open `/messages?wave={waveId}` and switch to `Leaderboard`.
- Change `Sort`.
- If `Group` is visible, pick one curation group or `All submissions`.
- Open a deep link with `curated_by_group` to pre-apply group filtering.
- In curation waves, open `Filters` and set `Minimum ETH` and/or `Maximum ETH`.

## Control Behavior

- `Sort` is always visible in the leaderboard header.
- On wider layouts, `Sort` uses compact pill tabs instead of a dropdown.
- `Sort` options are:
  - all waves: `Current Vote`, `Projected Vote`, `Hot`, `Newest`
  - curation waves only: `Price`
- In tab layout, the active sort stays filled and brighter than the inactive
  options so the current mode remains easy to scan.
- Inactive sort tabs keep a darker filled background and brighten on hover
  before selection.
- `Group` is shown only when curation groups load for that wave.
- `Group` options always include `All submissions` plus every loaded curation
  group.
- Group tabs can show a small avatar when group profile media is available.
- Selecting a group updates `curated_by_group` with in-place URL replace (no
  full-page navigation). Selecting `All submissions` removes that param.
- In curation waves, `Filters` toggles a panel with `Minimum ETH` and
  `Maximum ETH` inputs.
- Price changes commit on `Enter`, on input blur, or after a short typing pause.
- `Clear filters` resets both price bounds.
- On narrow layouts, curation action controls can switch to compact icon mode
  and can move beside the price inputs when wrapping is needed.
- Header layout is width-based:
  - tries view-mode tabs + `Sort` tabs + `Group` tabs
  - falls back to `Sort` dropdown + `Group` tabs
  - falls back again to `Sort` dropdown + `Group` dropdown
  - enables horizontal control-row scroll if even dropdown layout does not fit

## User Journey

1. Open `Leaderboard`.
2. Pick a `Sort` mode.
3. Optional: pick a `Group`.
4. Optional (curation waves): open `Filters` and set min/max ETH bounds.
5. Compare results in the current leaderboard view mode.

## Edge Cases

- Some sort/group/price combinations validly return empty results.
- If no curation groups exist, `Group` stays hidden.
- While curation groups are still loading, URL `curated_by_group` can stay
  active for requests until groups resolve.
- If URL `curated_by_group` does not match loaded groups, active filtering
  falls back to `All submissions`.
- If curation groups fail to load, `Group` stays hidden and results load
  unfiltered.
- URL `min_price` and `max_price` values are not used by leaderboard header UI.
- If both price bounds are set in reverse order (`min > max`), request bounds
  are normalized before fetch.

## Failure and Recovery

- Any sort, group, or price change triggers a fresh leaderboard query.
- If controls are clipped on small widths, scroll the controls row horizontally.
- If URL filtering looks wrong, switch to `All submissions` to clear
  `curated_by_group`.
- If price filtering looks wrong, use `Clear filters` to reset ETH bounds.

## Limitations / Notes

- Sort/group/price changes only affect leaderboard presentation.
- Sort preference is local per wave and browser, and is not part of the URL.
- URL persistence is only for `curated_by_group`.
- Price filters are not URL-synced and reset with wave-context remounts
  (for example changing to another wave thread).
- Group names and membership follow current curation-group configuration.
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
