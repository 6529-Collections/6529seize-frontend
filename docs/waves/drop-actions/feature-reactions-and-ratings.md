# Wave Drop Reactions and Rating Actions

## Overview

Wave drop cards support emoji reactions and rating actions directly in the drop
controls. Reaction and rating changes appear immediately on the drop while the
request is in flight, then stay if the request succeeds or roll back if it
fails.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop drop action bar (hover actions) and mobile drop action menu
- Reaction chips shown below drop content

## Entry Points

- Hover a drop on desktop and use quick-react buttons, the emoji picker button,
  or clap rating controls.
- Open the mobile drop menu and use quick reactions, emoji picker, or rating
  controls.
- Tap an existing reaction chip on a drop to toggle that reaction.
- Open reaction details from chip tooltip overflow (`and N others`) or long
  press on touch devices.

## User Journey

1. Open a wave or direct-message thread and locate a drop.
2. Choose a reaction path:
   - quick-react from recent emojis,
   - open emoji picker and choose an emoji, or
   - tap an existing reaction chip.
3. The selected reaction state and counts update immediately on the drop.
4. If the request succeeds, the new reaction state remains.
5. If the request fails, the drop restores the previous reaction state and
   shows an error toast.
6. For rating, adjust the value with `+` / `-` controls and submit with clap.
7. The drop rating totals update immediately, then stay on success or revert on
   failure.

## Common Scenarios

- Selecting a new emoji replaces the viewer's prior reaction on that drop.
- Selecting the same reaction again removes the viewer's reaction.
- Reaction chips show emoji plus count; selecting a chip toggles participation.
- Tooltip summaries show up to a few reacting profiles and expose an overflow
  path to a full reaction-detail dialog.
- Repeated clap taps in a short burst are batched into one rating submission.

## Edge Cases

- Temporary (unsent) drops disable reaction and rating actions.
- On touch devices, long press opens reaction details instead of toggling.
- If a reaction count reaches zero after removal, that reaction chip disappears.
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

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Media Download](feature-media-download.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
