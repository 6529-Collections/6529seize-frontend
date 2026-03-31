# Wave Right Sidebar Jump Actions

## Overview

This page is the canonical owner for right-sidebar drop-target actions.

- `Trending` cards and `Activity` rows request an in-thread serial jump.
- `Leaderboard` and `Winners` rows open a single-drop overlay by setting
  `drop={dropId}`.

All actions stay in the current wave thread context.

## Action Map

| Section | Trigger | Result |
| --- | --- | --- |
| `Trending` | Select a card | Scroll chat to target serial in current thread |
| `Activity` | Select `View drop in chat` | Scroll chat to target serial in current thread |
| `Leaderboard` | Select a row | Set `drop={dropId}` and open drop overlay |
| `Winners` | Select a row | Set `drop={dropId}` and open drop overlay |

## Location in the Site

- Right sidebar on `/waves/{waveId}` and `/messages?wave={waveId}`
- Inline and overlay right-sidebar variants
- Right sidebar is hidden while a `drop` overlay is open

## Availability by Wave State

- `Trending` appears in sidebar `About` content:
  - rank waves: inside `About` tab
  - non-rank waves: default sidebar content
- `Activity` is rank-wave only and uses vote-edit logs.
- `Leaderboard` is rank-wave only while voting is active.
- `Winners` is rank-wave only after first decision is reached.
- `Voters` rows do not have drop-target actions.

## User Journey

1. Open a wave thread and open the right sidebar.
2. Choose `Trending`, `Activity`, `Leaderboard`, or `Winners`.
3. Trigger a target action.
4. If action is `Trending` or `Activity`, chat jumps to that serial:
   - already loaded target: immediate scroll
   - older target: older pages load, then scroll
5. If action is `Leaderboard` or `Winners`, overlay opens with `drop={dropId}`.
6. Close overlay to remove `drop` and return to the same thread context.

## States and Edge Cases

- `Trending` empty state: `No boosted drops yet`.
- `Activity` empty state: `Be the First to Make a Vote`.
- Serial jump state is in-session only; it does not write `serialNo` to URL.
- While a `drop` overlay is open, sidebar actions are unavailable.

## Failure and Recovery

- Serial jump timeouts/failures do not show a dedicated in-UI error state.
- Retry the same action.
- If needed, open the same target through a direct `serialNo` link path.
- Sidebar lists poll and retry automatically, so temporary fetch issues can look
  like short-lived empty content.
- If a `Leaderboard` or `Winners` row does not open overlay, close and retry.

## Limitations / Notes

- Actions do not support cross-wave jumps.
- This page owns jump/open behavior only. Section rendering stays documented in
  each section page.

## Related Pages

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Leaderboard](feature-right-sidebar-leaderboard.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Winners Tab](../leaderboard/feature-winners-tab.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
