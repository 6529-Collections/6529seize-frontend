# Profile Brain Activity Heatmap

## Overview

The `Brain` tab can show an `Activity` card above the drop feed for the viewed
profile.
The card summarizes that profile's public posts over the last 12 months and
renders them as a day-by-day heatmap.

## Location in the Site

- Route: `/{user}/brain`
- Placement: left content column above the Brain feed
- Visibility: shown only when the resolved profile provides a usable Brain
  identity (handle, resolved query, or primary wallet)

## Entry Points

- Open `/{user}/brain`.
- Switch to `Brain` from another profile tab.
- Follow a shared Brain-tab URL for a profile with Waves available.

## User Journey

1. Open `/{user}/brain`.
2. After profile resolution completes, the `Activity` card starts a separate
   activity request for that profile identity.
3. While data is loading, the card shows a compact heatmap skeleton.
4. After data resolves, the card header shows total public posts in the last 12
   months and the grid snaps to the latest visible weeks.
5. The heatmap shows one day per cell, grouped into weekly columns with month
   labels across the top.
6. Day tooltips show the post count and date for individual cells.
7. The Brain feed remains below the card for opening posts and scrolling older
   drops.

## Common Scenarios

- The header shows `N public post(s) in the last 12 months`.
- Empty activity still renders the card header and shows `No activity in last
  12 months.`
- Failed activity requests show `Unable to load activity.`
- Narrow viewports keep the latest columns visible by default and allow
  horizontal scrolling to older weeks.
- Higher-activity days render brighter and larger cells than low-activity days.

## Edge Cases

- The card is omitted entirely when the profile has no handle, resolved query,
  or primary wallet available for Brain activity lookup.
- The heatmap covers exactly 365 days ending on the backend-provided anchor
  date; it is not based on the viewer's local timezone.
- Cell intensity is relative to that profile's own active days, so the same
  number of posts can appear brighter or dimmer on different profiles.
- Zero-count days stay visible as empty cells so month and week alignment
  remains stable.

## Failure and Recovery

- If the activity request fails, the card shows `Unable to load activity.`;
  refresh the page to retry.
- If the profile route itself cannot be resolved, users see the shared not-found
  screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If Waves is unavailable in the current context, the Brain route can redirect
  before the activity card is shown:
  [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)

## Limitations / Notes

- The card summarizes public-post counts only; detailed post reading and thread
  opening still happen in the Brain feed below.
- The card does not expose inline post actions or filters.
- The heatmap is a compact summary surface, not a substitute for feed history.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Brain Tab](feature-brain-tab.md)
- [Profile Brain Tab Wave Sidebar](feature-brain-wave-sidebar.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
