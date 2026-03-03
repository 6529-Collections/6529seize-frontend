# Wave Leaderboard Sort and Group Filters

## Overview

Use leaderboard header filters to:
- reorder drops with `Sort` (`Current Vote`, `Projected Vote`, `Hot`, `Newest`)
- filter to one curation `Group` when groups exist

`Sort` is saved per wave in local browser storage. `Group` is URL-synced with
`curated_by_group={groupId}`.

## Location in the Site

- `Leaderboard` tab header on `/waves/{waveId}`.
- `Leaderboard` tab header on `/messages?wave={waveId}`.
- Legacy wave links (`/waves?wave={waveId}`) redirect to `/waves/{waveId}` and
  keep other query params, including `curated_by_group`.

## Entry Points

- Open `/waves/{waveId}` and switch to `Leaderboard`.
- Open `/messages?wave={waveId}` and switch to `Leaderboard`.
- Change `Sort`.
- If `Group` is visible, pick one curation group or `All submissions`.
- Open a deep link with `curated_by_group` to pre-apply group filtering.

## Control Behavior

- `Sort` is always visible in the leaderboard header.
- `Sort` options are `Current Vote`, `Projected Vote`, `Hot`, and `Newest`.
- `Group` is shown only when curation groups load for that wave.
- `Group` options always include `All submissions` plus every loaded curation
  group.
- Group tabs can show a small avatar when group profile media is available.
- Selecting a group updates `curated_by_group` with in-place URL replace (no
  full-page navigation). Selecting `All submissions` removes that param.
- Header layout is width-based:
  - tries view-mode tabs + `Sort` tabs + `Group` tabs
  - falls back to `Sort` dropdown + `Group` tabs
  - falls back again to `Sort` dropdown + `Group` dropdown
  - enables horizontal control-row scroll if even dropdown layout does not fit

## User Journey

1. Open `Leaderboard`.
2. Pick a `Sort` mode.
3. Optional: pick a `Group`.
4. Compare results in the current leaderboard view mode.

## Edge Cases

- Some sort/group combinations validly return empty results.
- If no curation groups exist, only `Sort` is shown.
- While curation groups are still loading, URL `curated_by_group` can stay
  active for requests until groups resolve.
- If URL `curated_by_group` does not match loaded groups, active filtering
  falls back to `All submissions`.
- If curation groups fail to load, `Group` stays hidden and results load
  unfiltered.

## Failure and Recovery

- Any sort or group change triggers a fresh leaderboard query.
- If controls are clipped on small widths, scroll the controls row horizontally.
- If URL filtering looks wrong, switch to `All submissions` to clear
  `curated_by_group`.

## Limitations / Notes

- Sort/group changes only affect leaderboard presentation.
- Sort preference is local per wave and browser, and is not part of the URL.
- URL persistence is only for `curated_by_group`.
- Group names and membership follow current curation-group configuration.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Waves Index](../README.md)
- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
