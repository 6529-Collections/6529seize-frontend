# Wave Drop Link Preview Toggle

Parent: [Link Previews Index](README.md)

## Overview

Drop authors can hide or restore link previews for a single drop.

- `Hide link previews` appears beside preview cards in thread/chat surfaces.
- When previews are hidden, one inline `Show link previews` appears next to
  the first hidden link.
- The UI updates immediately, then confirms with the API.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Home-style drop cards that reuse wave markdown previews (for example
  leaderboard/boosted-card content)

Home-style cards suppress side-action buttons. If your drop is already hidden,
one inline `Show link previews` action can still appear.

## Entry Points

- Open your drop with at least one `http://` or `https://` URL.
- Select `Hide link previews`.
- Select inline `Show link previews` to restore cards.

## User Journey

1. Open a wave or direct-message thread.
2. Find your drop with at least one eligible URL.
3. Select `Hide link previews`.
4. The drop switches to plain links.
5. One inline `Show link previews` action appears next to the first hidden link.
6. Select `Show link previews` to restore cards.
7. While a toggle request is in flight, controls show loading and ignore
   repeat input.

## Common Scenarios

- Hide previews when you want plain text links in a drop.
- Restore previews later without editing the drop content.
- Toggle applies to all link-preview cards in the drop (generic and
  provider-specific).
- After success, you stay in the same thread context.

## Edge Cases

- Non-authors do not see the control.
- Proxy-profile sessions do not get toggle controls.
- Drops without `http(s)` links do not show toggle controls.
- Temporary drops (`temp-*`) can show the control disabled until the drop is
  persisted.
- When multiple links are hidden, only one inline `Show link previews` action
  is rendered.
- In home-style cards, side-action controls stay hidden.

## Failure and Recovery

- If the API toggle call fails, the UI rolls back to the previous preview
  state.
- The app shows an error toast (`Failed to toggle link preview` when no
  specific error text is returned).
- Retry from the same drop after the network or permission issue is resolved.

## Limitations / Notes

- Visibility is drop-level, not per-link.
- Toggle controls live near link content (side action when visible, inline
  recovery action when hidden).
- The action is not exposed through overflow/short menus.

## Related Pages

- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Link Previews Index](README.md)
- [Docs Home](../../README.md)
