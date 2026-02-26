# Wave Chat Serial Jump Navigation

## Overview

Wave and DM threads support serial-target navigation so links and in-thread actions
can jump directly to a specific drop.
When a thread opens with `serialNo`, the list resolves the target, scrolls to it,
and applies a temporary highlight that fades out.
If the target is outside the currently loaded window, the client loads surrounding
pages first, then finalizes the jump.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Shared links and in-thread actions that target a specific drop serial.

## Entry Points

- Open a shared thread link with `serialNo`.
- Open a shared thread link with both `serialNo` and `divider`.
- Use in-thread jump actions that target serials (for example search results,
  unread controls, or boosted/activity jump actions).

## User Journey

1. Open a wave/DM thread from a link or action that includes `serialNo`.
2. The thread hydrates around current data, then resolves the target serial.
3. If the serial is outside the loaded window, the client requests focused ranges
   and historical pages until the target can be rendered.
4. The target drop is scrolled into view and receives temporary visual highlight.
5. If a `divider` query is present, unread-boundary context is applied during the
   same initialization flow.
6. After initialization, consumed jump params are cleared from the URL so normal
   browsing can continue.

## Common Scenarios

- Links using canonical `/waves/{waveId}?serialNo={serialNo}` jump to the expected
  drop in wave threads.
- DM links using `/messages?wave={waveId}&serialNo={serialNo}` jump in the same way.
- When both `serialNo` and `divider` are present, jump targeting and unread-boundary
  context can both be initialized.
- During jump hydration, long tweet previews can appear compact first and expand with
  `Show full tweet` later.

## Edge Cases

- If the target serial is far outside loaded data, multiple fetches may run before
  the target becomes visible.
- If a link includes `serialNo` but no `divider`, unread boundary still uses current
  unread metadata when available.
- Invalid or unresolved serial values keep users in the current thread context
  without blocking normal reading.

## Failure and Recovery

- If jump targeting stalls, temporary scrolling overlays clear and normal scrolling
  stays available.
- If target data is not immediately resolvable, users can continue reading and retry
  by reopening the same link.
- If URL cleanup for jump params fails transiently, list interactions remain usable
  and reloading the thread typically re-syncs state.

## Limitations / Notes

- Serial jump is navigation aid, not a persistent filtered view.
- Highlighting is temporary and shown only for explicit serial-target flows.
- Jump completion depends on the target serial existing in accessible thread data.

## Related Pages

- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](../drop-actions/feature-quote-link-cards.md)
