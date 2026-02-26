# Wave Drop Quote Link Cards

## Overview

Same-origin thread links with serial targets can render as quote-link cards inside
wave drop content instead of plain URLs.
Quote-card rendering is bounded to prevent recursive nesting.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop markdown content where same-origin links include serial targets.

## Entry Points

- Open a drop containing a same-origin serial-target link.
- Click quote links from current thread or from links that route to another thread.
- Open legacy serial link formats that normalize to canonical thread+serial format.

## User Journey

1. Open a thread with a same-origin link targeting another drop serial.
2. Renderer recognizes link as quote candidate and attempts quote-card rendering.
3. Quote card shows target drop preview when the target can be resolved.
4. Clicking the quote opens the target drop in-thread or routes to target thread as
   needed.

## Common Scenarios

- Links in canonical `/waves/{waveId}?serialNo={serialNo}` format render as quote
  cards.
- Legacy `/waves?wave={waveId}&serialNo={serialNo}` links normalize to same target.
- Quote links targeting current thread jump in-place.
- Quote links targeting other threads route to that thread and target serial.
- Links targeting the currently opened drop remain normal anchors instead of nested
  quote cards.

## Edge Cases

- Links carrying `drop` query are handled by drop-preview/open flow, not quote-card
  recursion.
- If same-origin link revisits a drop already in current quote chain, card rendering
  is skipped to avoid recursive nesting.
- Quote-card expansion is capped at 4 nested levels; beyond that, links stay plain.
- Trailing-slash serial values (for example `serialNo=10/`) are normalized and still
  target intended serial.

## Failure and Recovery

- If linked target cannot be resolved immediately, link stays clickable as normal URL.
- If target is cyclic/self-referential, renderer keeps plain-link fallback.
- If depth guard is reached, link remains usable without further expansion.

## Limitations / Notes

- Quote-card rendering applies only to same-origin links with valid wave and serial
  values.
- Quote rendering is intentionally bounded by maximum embed depth.

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Content Display](feature-content-display.md)
