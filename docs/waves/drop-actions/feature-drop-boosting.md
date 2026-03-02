# Wave Drop Boosting

## Overview

Boosting is a per-user toggle on full drop cards in wave and direct-message
threads.

Boosted ranking appears in two places:

- in-thread boosted cards inserted into the message list (fixed `Day` window)
- right-sidebar `Trending` cards (`Day`, `Week`, `Month`)

This page owns boost toggles and shared boosted-card interaction behavior.
Sidebar layout and `Trending` shell behavior are documented in
[Wave Right Sidebar Trending Drops](../sidebars/feature-right-sidebar-trending-drops.md).

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Full drop cards in thread message lists
- Boosted cards in the thread list and right-sidebar `Trending`

## Entry Points

- Desktop: hover a full drop and use the flame button in the action bar.
- Mobile: open the touch menu and choose `Boost` or `Remove Boost`.
- Any boosted card: press the card body to jump to that drop.
- Any boosted card: press the flame/count button to boost or unboost without
  triggering jump.

## User Journey

1. Open a wave thread and locate a full drop.
2. If you are connected and the drop is posted (not `temp-*`), toggle boost.
3. The flame icon toggles:
   - outlined flame: you have not boosted this drop
   - filled flame: you have boosted this drop
4. Full-drop controls update optimistically. Icon and count change immediately.
5. If the request succeeds, the new state remains.
6. If the request fails, the icon/count roll back and an error toast appears.
7. From any boosted card:
   - press card body to jump to that serial in the same thread
   - press card flame/count to toggle boost without jumping
8. If the target serial is not loaded yet, the thread loads older pages, then
   retries scroll and centers the target drop.

## Common Scenarios

- Boosting a zero-count drop shows the count next to the flame; unboosting back
  to zero hides the count on full-drop controls.
- In-thread boosted cards are inserted at fixed feed anchors before drops at
  depths `5`, `10`, `20`, `40`, `80`, and `160` from newest.
- In-thread insertion shows up to six ranked cards (`#1` to `#6`) when enough
  drops are loaded.
- Sidebar `Trending` shows up to five ranked cards and supports `Day`, `Week`,
  and `Month`.
- Rank badges use yellow for `#1`, silver for `#2`, amber for `#3`, and neutral
  styling below top three.
- Sidebar cards use stronger highlight for `#1`; lower ranks are intentionally
  muted.
- When new drops arrive, in-thread boosted cards move upward with the feed; they
  do not stay pinned near the newest message.

## Edge Cases

- Not connected:
  - desktop full-drop boost button is disabled
  - mobile touch-menu boost row is hidden
  - boosted-card flame/count button is disabled
- Temporary/unsent drops (`temp-*`) cannot be boosted.
- One drop cannot be boosted/unboosted repeatedly while a prior toggle is still
  pending.
- Mobile touch-menu boost actions trigger a centered overlay animation (flame on
  boost, smoke on unboost). Reduced-motion users skip animation.
- If there are not enough loaded drops for every anchor slot, fewer in-thread
  boosted cards render.
- If fewer than five drops are loaded, no in-thread boosted cards render yet.
- Loading older history above current anchors does not move existing in-thread
  boosted-card anchor positions.

## Failure and Recovery

- Failed boost/unboost requests roll back optimistic full-drop updates and show
  an error toast.
- After successful toggles, wave-specific boosted-ranking queries are invalidated
  so cards refresh from server data.
- Boosted-ranking queries retry failed fetches and continue polling while the
  thread/sidebar surface is open.
- Jump-to-drop from boosted cards keeps loading and retrying scroll until the
  target serial is rendered or the operation times out.

## Limitations / Notes

- Boosting is available on full drop cards and boosted cards, not compact
  light-drop rows.
- In-thread boosted-card insertion uses a fixed `Day` window, fixed feed
  anchors, and a capped visible set.
- Sidebar `Trending` has a five-card cap and no custom date range.
- This page does not document sidebar tab-shell behavior; see sidebars docs.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Right Sidebar Trending Drops](../sidebars/feature-right-sidebar-trending-drops.md)
- [Wave Drops Index](../README.md)
