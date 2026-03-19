# Wave Drop Link Preview Toggle

Parent: [Link Previews Index](README.md)

## Overview

Drop authors can hide or restore link previews for a single drop.

- Visible preview and quote cards expose `Hide link previews` inside their
  `Link actions` menu.
- On desktop, the `Link actions` trigger appears on hover or keyboard focus.
- On touch and mobile, the trigger stays visible on the card.
- When previews are hidden in a thread, the desktop `More` menu can show
  `Restore link previews`.
- The UI updates immediately, then confirms with the API.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Link preview cards and quote cards inside drop markdown:
  `Link actions` -> `Hide link previews`
- Thread desktop `More` menu: `Restore link previews` when the authored drop is
  already hidden
- Home-style drop cards that reuse wave markdown previews (for example
  leaderboard/boosted-card content)

Home-style cards suppress side-action buttons and do not expose a restore
action once previews are hidden.

## Entry Points

- Open your drop with at least one `http://` or `https://` URL.
- Open `Link actions` from a visible preview or quote card, then select
  `Hide link previews`.
- If previews are already hidden on desktop, open `More` and select
  `Restore link previews`.

## User Journey

1. Open a wave or direct-message thread.
2. Find your drop with at least one eligible URL.
3. Open `Link actions` on a visible preview or quote card.
4. Select `Hide link previews`.
5. The drop switches to plain links without an inline restore button in the
   markdown body.
6. Open the desktop `More` menu for that drop.
7. Select `Restore link previews` to restore cards.
8. While a toggle request is in flight, controls show loading and ignore
   repeat input.

## Common Scenarios

- Hide previews when you want plain text links in a drop.
- Restore previews later from the desktop `More` menu without editing the drop
  content.
- Toggle applies to all preview cards in the drop (generic, provider-specific,
  and quote-card rendering).
- The same card menu also contains `Copy link` and `Open link`.
- After success, you stay in the same thread context.
- While a card menu is open, the overlapping drop action tray stays hidden.

## Edge Cases

- Non-authors do not see the control.
- Proxy-profile sessions do not get toggle controls.
- Drops without `http(s)` links do not show toggle controls.
- Temporary drops (`temp-*`) can show the control disabled until the drop is
  persisted.
- Touch action menus do not expose `Restore link previews`.
- In home-style cards, side-action controls stay hidden and there is no
  restore action.

## Failure and Recovery

- If the API toggle call fails, the UI rolls back to the previous preview
  state.
- The app shows an error toast (`Failed to toggle link preview` when no
  specific error text is returned).
- Retry from the same drop after the network or permission issue is resolved.

## Limitations / Notes

- Visibility is drop-level, not per-link.
- `Hide link previews` lives inside each visible card's `Link actions` menu.
- `Restore link previews` currently lives in the desktop `More` menu once
  previews are hidden.
- Hidden previews fall back to plain links until the author restores previews
  from that menu.
- The restore action is not exposed through touch menus or home-style cards.

## Related Pages

- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Link Previews Index](README.md)
- [Docs Home](../../README.md)
