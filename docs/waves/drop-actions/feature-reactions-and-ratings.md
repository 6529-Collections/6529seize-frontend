# Wave Drop Reactions and Rating Actions

## Overview

Posted full drops support two interaction paths:

- emoji reactions (quick react, picker, and reaction chips)
- clap rating (set value with `+` / `-`, then submit with clap)

Both flows are optimistic: UI updates immediately, then either confirms or
rolls back if the request fails.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop hover action bar on full drops
- Touch drop action menu
- Reaction chips below full drop content

## Entry Points

- Use quick-react buttons in the action bar/menu.
- Use `Add Reaction` / `Update Reaction` to open the emoji picker.
- Click or tap a reaction chip to toggle that same reaction.
- Open reaction details from:
  - desktop tooltip overflow (`and N others`)
  - long press on a reaction chip on touch devices
- When rating is visible, set value with `+` / `-` and submit with clap.

## User Journey

1. Open a wave or direct-message thread and locate a posted full drop.
2. React with quick react, picker, or a reaction chip.
3. The app keeps one reaction per viewer per drop:
   - choosing a new emoji replaces your previous reaction
   - choosing your current emoji removes your reaction
4. Reaction chips show emoji + count. Desktop tooltip previews up to 3 profiles.
5. If more profiles reacted, `and N others` opens **Reactions**.
6. In **Reactions**, pick an emoji on the left and review profile rows on the
   right.
7. If rating controls are visible, adjust value with `+` / `-` and press clap.
8. Reaction and rating UI update immediately, then either confirm or roll back.

## Common Scenarios

- Quick-react options come from local emoji history. If history is empty, quick
  react falls back to `:+1:`.
- Touch move inside the mobile emoji picker stays inside the picker dialog.
- Repeated clap taps in a short burst are merged into one rating request.
- Rating values are clamped to each drop's allowed min/max range.

## Edge Cases

- Temporary drops (`temp-*`) cannot be reacted to and do not show rating actions.
- Light placeholder drops do not render reaction or rating controls.
- Chat drops do not show clap rating controls.
- Memes-wave participatory drops hide clap rating controls.
- In the mobile action menu, rating controls are hidden for the drop author.
- On touch devices, long press opens reaction details instead of toggling the
  chip.
- If a reaction count reaches zero, that chip disappears.
- Profiles without a handle are shown as plain IDs (no profile link).

## Failure and Recovery

- If add/remove reaction fails, optimistic reaction state rolls back and users
  can retry immediately.
- If rating submit fails, optimistic rating state rolls back and users can retry.
- Failures surface as toast errors while users stay in the same thread.

## Limitations / Notes

- This page covers thread drop action controls only.
- Standalone voting controls are documented in:
  - [Wave Drop Vote Slider](feature-vote-slider.md)
  - [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- Rating controls are hidden in most unavailable states (for example: not logged
  in, no profile, proxy session, winner, voting not started/ended, or ineligible
  to vote).
- If rating is visible but the viewer has no available credit, clap stays visible
  in a disabled state with a tooltip.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Docs Home](../../README.md)
