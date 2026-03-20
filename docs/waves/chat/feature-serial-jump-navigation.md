# Wave Chat Serial Jump Navigation

## Overview

Serial jump moves a wave or DM thread to a target drop serial.

If the target is already loaded, chat scrolls to it.
If not, chat loads history around that serial and retries.

The target drop gets a temporary highlight.
When `serialNo` parses as a valid number, chat treats `serialNo` and `divider`
as one-time setup values and removes them from the URL.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Thread query values: `serialNo` and `divider`
- `divider` is applied only when `serialNo` is valid

## Entry Points

- Open a serial-target link:
  - `/waves/{waveId}?serialNo={serialNo}`
  - `/messages?wave={waveId}&serialNo={serialNo}`
- Select a result from thread `Search messages`.
- Select a result from header search `In this Wave`.
- Use jump controls that target a serial:
  - Reply preview click
  - Quote-card click
  - Unread jump control
  - Boosted/trending drop jump cards
  - Right-sidebar activity or leaderboard jump items

## User Journey

1. Start a jump from a serial link or jump control.
2. If the jump starts from thread `Search messages`, the view switches to
   `Chat`.
3. Chat tries an in-place jump for the current wave.
4. If the target is loaded, chat scrolls and centers the drop.
5. If the target is not loaded, chat fetches around the target serial and
   retries.
6. During long jumps, a temporary loading overlay can appear.
7. The target drop is highlighted briefly, then thread browsing continues.

## Common Scenarios

- Wave and DM serial links use the same jump pipeline.
- Header search `In this Wave` can queue a jump until chat scroll handling for
  that wave is ready.
- Thread and header search can fall back to setting `serialNo` in URL if an
  in-place handler is unavailable.
- If `serialNo` is present without valid `divider`, divider setup falls back to
  current unread metadata when available.
- Same-thread quote-card clicks jump in place.
- Quote-card clicks to another thread navigate first, then jump by `serialNo`.

## Edge Cases

- `serialNo` values that cannot be parsed as integers are ignored.
- Very old targets can require additional history fetches.
- If a jump stalls, the loading overlay timeout clears and the thread stays
  usable.
- If a target cannot be resolved, chat stays at the current position.
- `drop` overlay navigation and `serialNo` jump navigation are separate
  mechanisms; when both are present, `drop` handling takes precedence.

## Failure and Recovery

- Retry the same jump action (search result, sidebar item, or link click).
- If history loading is slow, wait for loading to settle, then retry.
- If URL/query state looks stale, reload the thread and retry.

## Limitations / Notes

- Serial jump is a navigation aid, not a persistent filtered mode.
- Target highlight is temporary.
- Jump completion depends on the target serial existing in accessible history.
- URL-triggered jump params are one-time setup values only when `serialNo`
  parses successfully.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Header Search Modal](../../navigation/feature-header-search-modal.md)
- [Wave Right Sidebar Jump Actions](../sidebars/feature-right-sidebar-jump-actions.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](../drop-actions/feature-quote-link-cards.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
