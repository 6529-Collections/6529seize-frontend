# Wave Drop Reactions and Rating Actions

## Overview

Wave drop cards support emoji reactions and rating actions directly in the drop
controls. Reaction and rating changes appear immediately on the drop while the
request is in flight, then stay if the request succeeds or roll back if it
fails.

Only full-size drop cards expose enabled reaction and rating actions. Light
compact drop cards and temporary unsent drops keep those controls disabled.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop drop action bar (hover actions) and non-hover long-press drop action menu
- Reaction chips shown below drop content

## Entry Points

- Hover a drop on desktop and use quick-react buttons, the emoji picker button,
  or clap rating controls.
- Open the non-hover long-press drop menu and use quick reactions, emoji picker,
  or rating controls.
- Tap an existing reaction chip on a drop to toggle that reaction.
- Open reaction details from chip tooltip overflow (`and N others`) or long
  press on non-hover devices.

## User Journey

1. Open a wave or direct-message thread and locate a drop.
2. Choose a reaction path:
   - quick-react from recent emojis,
   - open emoji picker and choose an emoji, or
   - tap an existing reaction chip.
3. For existing reaction chips, up to three responders are previewed directly in the tooltip.
4. If a reaction has additional responders, `and N others` appears; clicking it opens the **Reactions** detail panel.
5. On non-hover devices, pressing and holding a reaction chip opens the same
   detail panel.
6. In the detail panel:
   - the left side lists all reaction types with totals,
   - selecting a reaction updates the user list on the right,
   - each row shows a profile avatar (when available) and display name.
7. The selected reaction state and counts update immediately on the drop.
8. If the request succeeds, the new reaction state remains.
9. If the request fails, the drop restores the previous reaction state and
   shows an error toast.
10. For rating, adjust the value with `+` / `-` controls and submit with clap.
11. The drop rating totals update immediately, then stay on success or revert on
    failure.

## Common Scenarios

- Selecting a new emoji replaces the viewer's prior reaction on that drop.
- Selecting the same reaction again removes the viewer's reaction.
- Reaction chips show emoji plus count; selecting a chip toggles participation.
- Tooltip summaries show up to a few reacting profiles and expose an overflow
  path to a full reaction-detail dialog.
- Display names in the tooltip are clickable profile links where handles exist, and
  plain profile identifiers are shown when a handle is unavailable.
- In the detail panel, users can switch between reaction types to review who reacted
  with each reaction.
- Repeated clap taps in a short burst are batched into one rating submission.

## Edge Cases

- Temporary (unsent) drops disable reaction and rating actions.
- Light compact drops disable reaction and rating actions; only full drops can
  be reacted to.
- On non-hover devices, long press opens reaction details instead of toggling.
- If a reaction count reaches zero after removal, that reaction chip disappears.
- If the reaction list is long, the detail panel still uses one selected reaction
  and lets you switch between all options.
- Rating controls clamp to each drop's allowed min/max range.

## Failure and Recovery

- If add/remove reaction fails, optimistic reaction UI is rolled back and users
  can retry immediately.
- If rating submission fails, optimistic rating totals and user rating context
  roll back to the previous values.
- Error responses surface through drop-level toast messages without leaving the
  thread.

## Limitations / Notes

- Rating controls appear only where voting is available for the current viewer
  and drop type.
- This page covers wave drop action controls, not the standalone vote
  slider/numeric vote module.
- Reaction quick-action options depend on locally stored recent reactions.
- Direct links in reaction details require a profile handle; entries without handles
  appear as plain identifiers.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Media Download](feature-media-download.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Docs Home](../../README.md)
