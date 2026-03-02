# Wave Chat Unread Divider and Jump Controls

## Overview

When an unread boundary serial is known, the thread inserts a `New Messages`
divider at that drop and can show a floating unread-jump control.

Unread controls can stack with bottom/pending controls so both actions stay reachable.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Thread message list and floating bottom-right control area

## Entry Points

- Open a wave row with known first unread serial (row links may include `divider`).
- Open a serial-target link that includes both `serialNo` and `divider`.
- Open a serial-target link without `divider` (uses current unread metadata when available).
- Use `Mark as unread` on a drop.

## User Journey

1. Open a thread with a known unread boundary serial.
2. The thread inserts `New Messages` at that serial.
3. If the divider is off-screen, a floating unread control appears.
4. Use the control to jump to the unread boundary.
5. The control hides while divider is visible.
6. Sending a new message clears current unread-divider state.

## Common Scenarios

- Divider source comes from first-unread metadata, explicit `divider`, or `Mark as unread`.
- Unread control arrow points up or down based on divider position.
- When unread and bottom controls are both visible, they render as a combined stacked control.
- Count labels are compact and cap at `99+`.
- On desktop, a close button on the unread control dismisses the current boundary.
- Swipe-right dismissal is supported for unread control interactions.

## Edge Cases

- Invalid `divider`/`serialNo` values do not block thread rendering.
- If divider target is not loaded yet, unread control can still appear until history loads.
- After users see the divider once and move away, current unread boundary auto-dismisses.
- Escape dismiss works unless focus is currently inside a dialog.
- Manual dismiss and auto-dismiss apply only to the current boundary; a new boundary
  or reopened thread can show control again.

## Failure and Recovery

- If unread jump stalls on long history, wait for load, then retry control.
- If control was dismissed accidentally, reopen the thread or mark another drop unread.
- If unread boundary looks stale, refresh thread to resync unread metadata.

## Limitations / Notes

- Unread divider needs a valid unread serial boundary.
- Controls are navigation aids, not a full unread-history manager.
- Unread navigation is separate from `drop` overlay navigation.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md)
- [Wave Drop Actions - Mark as Unread](../drop-actions/feature-mark-as-unread.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Sidebars Features](../sidebars/README.md)
