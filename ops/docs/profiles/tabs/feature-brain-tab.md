# Profile Brain Tab

## Overview

The `Brain` tab shows a profile's activity summary and drop feed, including
replies.
The `Activity` card above the feed is documented separately in
[Profile Brain Activity Heatmap](feature-brain-activity-heatmap.md).
Clicking a drop body or quote preview opens that thread in Waves or Messages.
The companion `Created Waves` and `Recently Active In` surfaces inside this tab
are documented separately in
[Profile Brain Tab Wave Sidebar](feature-brain-wave-sidebar.md).
On your own profile, the compact `Quick Tags` section appears beneath
`Activity`. Its manager stays in the card; create and edit forms use a mobile
bottom sheet and remain inline on wider screens.

## Location in the Site

- Route: `/{user}/brain`
- Tab visibility: `Brain` is shown only when Waves is available for the current
  viewer context.

## Entry Points

- Open `/{user}/brain` directly.
- Switch to `Brain` from another profile tab.
- Follow a shared Brain-tab URL.

## User Journey

1. Open `/{user}/brain`.
2. Profile route resolution runs first (canonical-handle redirects and
   not-found behavior follow shared profile route rules).
3. If the route was opened directly while client hydration, wallet
   reconnection, or connected-profile restoration is still in progress, the
   profile shell keeps the `/{user}/brain` URL and shows a blank content
   placeholder until Brain access resolves.
4. If `Brain` is visible once access resolves and the route maps to a profile,
   the tab loads the `Activity` card and first drop page.
5. If the viewed profile exposes a Brain identity, the `Activity` card renders
   above the feed.
6. On your own profile, use the `Quick Tags` section beneath `Activity` to open
   the inline manager or a create/edit form. Mobile create and edit forms open
   in a bottom sheet while the Brain page stays in place.
7. Select a drop or quote preview to open its thread:
   - public wave drop: `/waves/{waveId}?serialNo={serialNo}`
   - direct-message drop: `/messages/{waveId}?serialNo={serialNo}`
8. Scroll to load older drops.

## Common Scenarios

- Visit someone else's profile Brain tab to read latest drops.
- Visit your own profile Brain tab to review recent drops.
- On your own profile, see up to three Quick Tags in the compact section; the
  controls wrap at narrow widths, and `+N more` indicates additional tags and
  opens the inline manager.
- On mobile, selecting `New Quick Tag` or a Quick Tag to edit opens a
  bottom-anchored sheet. Cancelling or dismissing it returns to the preceding
  compact summary or manager without changing the Brain page.
- Open a shared `/{user}/brain` link directly and stay on that route while the
  app decides whether Waves is available for the current viewer.
- If Waves becomes available during that access check, the same
  `/{user}/brain` URL stays selected and loads the feed without a route change.
- Initial load shows `Loading drops...`.
- Empty feeds show `No Drops to show`.
- Loading older pages shows `Loading more drops...`.

## Edge Cases

- `Brain` is hidden when Waves is unavailable in the current context.
- If `/{user}/brain` is opened directly while Brain access is still unresolved,
  the route delays fallback instead of redirecting immediately.
- Once that access check settles and `Brain` is still hidden, profile tab
  navigation replaces the URL with `/{user}` and keeps the current query
  string.
- Feed content renders only after profile resolution returns a handle.
- Quick Tags are hidden when viewing another profile or acting through a proxy.

## Failure and Recovery

- If the profile route cannot be resolved, users see the shared not-found screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If the initial drop-feed request fails, users still see `No Drops to show`;
  refreshing retries the request.
- If loading additional pages fails while scrolling, already loaded drops stay
  visible; refresh and retry.

## Limitations / Notes

- The profile feed focuses on reading and opening drops; inline
  reply/quote action controls are not shown in this tab.
- Feed pagination requests 10 drops per page and loads older pages on bottom
  scroll intersection.
- Feed scope comes from the `/{user}` route path; unrelated query parameters do
  not switch the feed owner.
- The activity card and wave sidebar are companion surfaces around the same
  Brain feed; each has separate loading and empty states.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profiles Tabs Index](README.md)
- [Profile Brain Activity Heatmap](feature-brain-activity-heatmap.md)
- [Profile Brain Tab Wave Sidebar](feature-brain-wave-sidebar.md)
- [Quick Tags](../../waves/composer/feature-personal-mention-shortcuts.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Loading Status Indicators](../../shared/feature-loading-status-indicators.md)
