# Wave Information Panel

## Overview

Wave information lives in **About**, **REP**, and **Configuration**. Desktop
shows these sections in the right sidebar. Mobile shows the same sections in a
dismissible panel over the current wave view.

## Location in the Site

Wave threads on `/waves/{waveId}` and `/messages/{waveId}`, including selected
competition routes.

## Entry Points

Select the wave name to open **About**. Desktop also provides **Show right
sidebar**. About includes the creator, creation date, share control, and current
pinned drop with its content and media. Eligible viewers can add or edit REP.

## User Journey

1. Open a wave and select its name.
2. Read About or switch to REP or Configuration.
3. On mobile, close the panel, press Escape, or use Back to return to the original
   view. The competition, tab, curation, scroll and unfinished input remain in place.

## Common Scenarios

- The section order is About, REP, Configuration.
- Configuration owns wave access, chat availability, links, slow mode, curation
  management, chat history deletion and personal display preferences.
- Shared changes use administrator gear controls. Personal controls retain their
  own authentication requirements.
- Competition access, rules, appearance and pauses belong to **Settings** in the
  main row. Voter lists and vote activity belong to **Votes**.
- Information tabs support ArrowLeft, ArrowRight, Home and End. Mobile confines
  focus to the open panel and returns focus to its opener when it closes.

## Edge Cases

- A section that becomes unavailable falls back to About.
- Opening information does not change the wave route or selected competition.
- Missing wave data prevents the information content from rendering.

## Failure and Recovery

Close the panel and reopen it after reloading the wave if wave information could
not load. Competition-resource errors can be retried in their own main view.

## Limitations / Notes

Information section choice is in-session UI state. Panel labels and accessible
names use the message catalog; locales without the corresponding messages fall
back to en-US. Legacy rule and voting-unit values retain English domain labels.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Winners Tab](../leaderboard/feature-winners-tab.md)
- [Wave Creation Rules Step](../create/feature-rules-step.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
