# Wave Drop Open and Copy Links

## Overview

Drop-level `Open` / `Open drop` actions and link-card `Open link` /
`Copy link` actions are separate behaviors.

- `Open` / `Open drop` uses `drop={dropId}` to open single-drop view in the
  current thread.
- Preview cards and quote cards expose a `Link actions` button with
  `Copy link` and `Open link`.
- `Copy link` copies an absolute share URL that targets the drop with
  `serialNo={serialNo}`.
- Link-card `Copy link` copies the original referenced URL shown by that card.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Thread desktop `More` menu: `Open`, `Copy link`
- Thread mobile action sheet: `Open drop`, `Copy link`
- Link preview and quote cards in thread markdown: `Link actions` ->
  `Copy link`, `Open link`
- Leaderboard and winners cards can also show `Open` (same `drop` behavior).

## Entry Points

- Open a wave or DM thread.
- Use `Open` / `Open drop` from thread actions, or from leaderboard/winners
  cards where shown.
- Use `Copy link` from thread desktop `More` or thread mobile action sheet.
- Hover or focus a preview card on desktop, or use the always-visible touch
  trigger, then open `Link actions`.

## User Journey

1. Open a thread and find either a posted drop or a rendered link/quote card.
2. Choose `Open` / `Open drop` from drop actions when you want focused
   single-drop view.
3. The app sets `drop={dropId}` in the current URL and opens single-drop view.
4. For preview or quote cards, open `Link actions`.
5. The card menu shows `Copy link` and `Open link`.
6. `Copy link` copies the card's original referenced URL.
7. `Open link` follows the preview target:
   - same-origin targets can stay in-app
   - external targets open in a new tab
8. Close single-drop view or dismiss the card menu to continue thread browsing.

## Common Scenarios

- `Open` keeps the current route and keeps existing query params.
- `Open` is hidden for chat-type drops.
- Temporary drops (`temp-*`) disable `Copy link`.
- Desktop preview cards reveal `Link actions` on hover and keyboard focus.
- Touch and mobile preview cards keep the `Link actions` trigger visible.
- Quote cards, OpenGraph cards, and YouTube cards use the same overlay menu.
- While a link-card menu is open, overlapping drop action buttons stay hidden.
- Dismissing the link-card menu does not activate the underlying card.
- Desktop copy can still infer DM routes from stream context when DM scope data
  on the drop is incomplete.
- Mobile copy uses Clipboard API when available and falls back to textarea copy.

## Edge Cases

- Tabbing past the last link-card action closes the menu and continues normal
  page focus order.
- `Escape` closes an open link-card menu and returns focus to the trigger.
- If URL has both `drop` and `serialNo`, drop-open flow is handled first.
- On mobile single-drop view, opening the chat panel locks body scrolling until
  the panel closes.
- While a drop is open, route-level waves overview prefetch is skipped. After
  close, a short `drop_close` window (about 5 seconds) keeps that prefetch
  disabled briefly.

## Failure and Recovery

- If clipboard access is blocked, copy can fail without `Copied!`; restore
  clipboard access and try again.
- If a serial link targets older history, loading can take longer before the
  target appears.

## Limitations / Notes

- `Open` (`drop` query), copied drop links (`serialNo` query), and link-card
  `Open link` are different navigation mechanisms.
- Opening a copied link does not force single-drop overlay mode.
- `Copy link` is unavailable for temporary drops.
- Link-card actions depend on the preview or quote card being rendered. Once a
  drop hides previews, plain links remain but card action menus do not.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
