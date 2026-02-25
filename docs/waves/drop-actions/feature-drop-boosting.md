# Wave Drop Boosting

## Overview

Wave drops support a per-user boost action with immediate visual feedback.

Users can toggle a boost on a drop, and the boost count is shown on the same action control.
Top boosted drops in the current wave also appear as contextual cards in the same message list.
Mobile boost/remove actions now include short on-screen confirmation feedback: an icon animation appears on the active drop card, and a success toast confirms the result.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Full drop cards in wave message lists where action buttons are available
- Boosted drops cards injected into wave message list sections

## Entry Points

- Desktop: open a full drop and click the flame button in the action bar.
- Mobile: open the drop menu and choose **Boost** / **Remove Boost**.
- Wave message list: scroll through the feed to see boosted-drops cards and select one.

## User Journey

1. Open a wave thread and locate a full drop.
2. If your wallet is connected and the drop is already posted, tap/click the boost
   action.
3. The button toggles between outline and filled flame states:
   - Outline = not boosted by this account
   - Filled = already boosted by this account
4. The action applies optimistic UI feedback immediately (for most taps/presses).
5. If the server request succeeds, the resulting state persists and a success toast
   appears: `Boosted!` or `Boost removed`.
6. If the server request fails, the action and count revert to the previous
   values and an error toast is shown.
6. Boosted-drop cards in the message list can be selected to jump directly to the
   corresponding drop in the same thread.

## Common Scenarios

- A user boosts a drop:
  - the icon animates,
  - the boost count increases by one,
  - the control becomes filled.
- A user removes a boost:
  - the icon returns to outlined style,
  - the boost count decreases if it was previously at least one.
- Boosted drops cards show rank badges for the current boosted ranking (for example,
  `#1`, `#2`, ...).
- Boosted cards appear only for the trending set and include:
  - author
  - short content preview
  - current boost total
- Selecting a boosted card scrolls to the referenced drop and centers it in view.

## Edge Cases

- Unauthenticated users cannot toggle boosts.
- Temporary/unsent drops do not show boost controls.
- Mobile actions run a brief boost/unboost animation centered on the drop card.
  When reduced-motion mode is enabled, the animation is skipped.
- If a boosted drop card is not in the loaded message range, the thread loads the
  required pages during jump flow.
- If there are fewer positioned slots than available boosted drops, only the slots
  available in the list are used.

## Failure and Recovery

- If boost/unboost fails, the UI rolls back the optimistic update.
- A network error or request failure shows an explicit toast explaining that the
  action did not apply.
- On success, a short confirmation toast appears (`Boosted!` or `Boost removed`)
  to confirm the action was accepted.
- While a boost action is in-flight, the control is disabled to prevent duplicate
  toggles.
- If jump-to-drop needs older data, the list continues loading pages and then
  scrolls again when the target becomes available.

## Limitations / Notes

- Boosting is available only on full drop cards, not compact list-only variants.
- Temporary posts cannot be boosted.
- Boosted-drop cards are driven by the wave’s boosted ranking feed and only show a
  limited top set.

## Related Pages

- [Waves Drop Actions Index](README.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drops Index](../README.md)
