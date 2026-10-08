# Wave Right Sidebar Jump Actions

## Overview

Trending cards in About can jump to a drop in the current wave chat.
Competition leaderboard, winners and vote activity actions belong to their main
competition views.

## Location in the Site

About in the right sidebar on `/waves/{waveId}` and `/messages/{waveId}`.

## Entry Points

Open About and select a Trending card.

## User Journey

1. Open the current wave's information panel.
2. Select a Trending card.
3. Chat scrolls to its serial, loading older pages when needed.

## Common Scenarios

Already loaded drops scroll immediately. Trending displays `No boosted drops yet`
when it has no cards.

## Edge Cases

Serial jumps stay within the current wave. An open full-drop overlay hides the
sidebar actions.

## Failure and Recovery

Retry a jump that did not complete, or use a direct `serialNo` link for that drop.

## Limitations / Notes

Serial jumps are in-session actions and do not write a serial to the URL.

## Related Pages

- [Wave Information Panel](feature-right-sidebar-tabs.md)
- [Trending Drops](feature-right-sidebar-trending-drops.md)
- [Competition views](../competitions/feature-competitions.md)
- [Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
