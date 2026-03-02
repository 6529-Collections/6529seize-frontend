# Wave Chat Serial Jump Navigation

## Overview

Serial jump opens or repositions a thread to a specific drop serial.
It is used by shared links and by in-thread jump actions.

When the target resolves, the app scrolls it into view, applies temporary highlight,
and clears temporary jump UI.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Thread URL query values: `serialNo` and `divider`
- In-thread search and sidebar jump actions that target a drop serial

## Entry Points

- Open a shared serial-target link:
  `/waves/{waveId}?serialNo={serialNo}` or
  `/messages?wave={waveId}&serialNo={serialNo}`
- Open a serial-target link that also includes `divider`.
- Select a result from the in-thread `Search messages` modal.
- Select a drop from header search while already inside a wave thread.
- Use right-sidebar jump actions (for example boosted/activity serial jumps).

## User Journey

1. Trigger a serial jump from a link or in-thread action.
2. If the target serial is already loaded, the app scrolls to it immediately.
3. If it is not loaded, the app fetches around that serial, then retries the jump.
4. The target drop receives temporary visual highlight.
5. URL-triggered jumps consume `serialNo` (and `divider` when present), then remove
   those query values from the URL.
6. Normal thread browsing resumes.

## Common Scenarios

- Wave links using `/waves/{waveId}?serialNo={serialNo}` jump to the target drop.
- DM links using `/messages?wave={waveId}&serialNo={serialNo}` jump the same way.
- In-thread search can jump in-place through the shared wave-scroll context without
  changing route.
- If in-place scroll context is unavailable, search falls back to setting `serialNo`
  in the URL and re-initializing jump.
- If `serialNo` is present without `divider`, unread boundary falls back to current
  unread metadata when available.

## Edge Cases

- Invalid or non-numeric `serialNo` values are ignored; thread stays usable.
- Distant targets may require multiple backfill requests before they render.
- During long jumps, a temporary blocking overlay can appear and then clear.
- If both `drop` and `serialNo` are in the URL, `drop` overlay behavior is handled first.

## Failure and Recovery

- If jump targeting stalls, wait for data backfill and retry from the same action.
- If jump overlay clears before finding the target, continue reading and retry jump.
- If query cleanup fails transiently, reload the thread to resync URL state.

## Limitations / Notes

- Serial jump is a navigation aid, not a persistent filtered mode.
- Target highlight is temporary.
- Jump completion depends on the target serial existing in accessible thread history.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](../drop-actions/feature-quote-link-cards.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
