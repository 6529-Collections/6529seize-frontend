# Wave Chat Unread Divider and Jump Controls

## Overview

- Wave chat keeps one unread boundary at a time.
- When a boundary serial is active, chat inserts `New Messages` before that drop.
- If that divider is off-screen before you have seen it, chat shows a floating unread-jump control.
- Unread and bottom/pending controls can stack so both actions stay available.

## Location in the Site

- `/waves/{waveId}`
- `/messages/{waveId}`
- Thread message list and floating bottom-right control area

## Entry Points

- Open a wave or DM thread with unread metadata.
- Open a wave from a sidebar link that includes an unread position.
- Use `Mark as unread` on a drop.

## URL Rules

- `divider={n}` sets the unread position for the visit. It works on sidebar links and links that also target a message with `serialNo={n}`.
- If `divider` is missing or invalid, chat uses the first available unread position.
- Chat clears the one-time URL values after setup. Opening a link with only `divider` keeps chat at its usual entry position.

## User Journey

1. Open a thread with a known unread boundary serial.
2. Chat inserts `New Messages` before the matching drop.
3. If the divider is outside view, chat shows an unread-jump control with up/down arrow direction based on divider position.
4. Use the unread control to jump to that boundary.
5. If unread and bottom/pending controls are both needed, chat stacks them in one floating control group.
6. After the divider is seen and then leaves view, chat auto-dismisses the current boundary.

## Control and Dismiss Behavior

- Sending a new message clears the current unread boundary.
- `Mark as unread` can replace the boundary with the server-reported unread serial.
- If the divider target is not loaded yet, unread control can still appear while history loads.
- Manual dismiss is available from desktop close button and swipe-right gesture.
- Escape dismiss works unless focus is inside an element using `role="dialog"`.
- The unread position survives reloading the same wave visit. A dismissal lasts for that visit, including through a reload. Use `Mark as unread` to set a new position.
- Standalone unread and pending labels cap at `99+`.
- In stacked mode, controls switch to compact icon-first buttons.

## Failure and Recovery

- If unread jump stalls on long history, wait for load, then retry control.
- If unread control was dismissed accidentally, use `Mark as unread` to set a new boundary.

## Limitations / Notes

- Unread divider requires a valid unread serial boundary.
- Only one unread boundary is active at a time.
- Controls are navigation aids, not a full unread-history manager.
- Unread navigation is separate from `drop` overlay navigation.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md)
- [Wave Drop Actions - Mark as Unread](../drop-actions/feature-mark-as-unread.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Sidebars Features](../sidebars/README.md)
