# Wave Drop Open and Copy Links

## Overview

`Open` and `Copy link` are separate.

- `Open` / `Open drop` uses `drop={dropId}` to open single-drop view in the
  current thread.
- `Copy link` copies an absolute share URL that targets the drop with
  `serialNo={serialNo}`.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Thread desktop `More` menu: `Open`, `Copy link`
- Thread mobile action sheet: `Open drop`, `Copy link`
- Leaderboard and winners cards can also show `Open` (same `drop` behavior).

## Entry Points

- Open a wave or DM thread.
- Use `Open` / `Open drop` from thread actions, or from leaderboard/winners
  cards where shown.
- Use `Copy link` from thread desktop `More` or thread mobile action sheet.

## User Journey

1. Open a thread and find a drop.
2. Choose `Open` / `Open drop`.
3. The app sets `drop={dropId}` in the current URL and opens single-drop view.
4. Close single-drop view to remove `drop` and return to thread browsing.
5. Choose `Copy link` to copy an absolute serial-target URL:
   - wave thread: `/waves/{waveId}?serialNo={serialNo}`
   - DM thread: `/messages?wave={waveId}&serialNo={serialNo}`
6. Opening the copied URL runs serial-jump behavior for that thread.

## Common Scenarios

- `Open` keeps the current route and keeps existing query params.
- `Open` is hidden for chat-type drops.
- Temporary drops (`temp-*`) disable `Copy link`.
- Successful copy shows `Copied!` for about 2 seconds.
- Desktop copy can still infer DM routes from stream context when DM scope data
  on the drop is incomplete.
- Mobile copy uses Clipboard API when available and falls back to textarea copy.

## Edge Cases

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

- `Open` (`drop` query) and copied links (`serialNo` query) are different
  navigation mechanisms.
- Opening a copied link does not force single-drop overlay mode.
- `Copy link` is unavailable for temporary drops.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
