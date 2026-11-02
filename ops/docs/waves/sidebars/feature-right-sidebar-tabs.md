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
3. On mobile, swipe down from the handle or header, select Close, tap outside,
   press Escape, or use Back to return to the original view. The competition,
   tab, curation, scroll and unfinished input remain in place.

## Common Scenarios

- The section order is About, REP, Configuration. Desktop and mobile use the
  same compact pill styling for these sections.
- Configuration owns wave access, chat availability, links, slow mode, replies,
  curation management, chat history deletion and personal display preferences.
- Shared changes use administrator gear controls. Personal controls retain their
  own authentication requirements.
- On mobile, configuration gears open their editor inside the information
  panel. Links, chat settings, visibility and administrator access share the
  same Back and Close controls. Back (including browser Back or Escape) returns
  to Configuration without submitting changes; Save returns after a successful update.
  Failed saves keep the editor open for retry. Configuration keeps its selected
  tab and scroll position. Close or a downward header swipe dismisses the whole
  panel. The sheet keeps its height when opening an editor or returning with Back,
  so short forms do not pull its top edge down the screen.
  Sheet editors omit a duplicate Cancel button; desktop setting popovers keep
  Cancel. Chat, Links and Replies checkboxes use the shared dark styling.
- In Curations, the section plus opens Create curation. A row gear offers
  management actions including Edit Curation. Both forms stay inside the same
  mobile sheet or tablet panel, with inline group selection and Back to
  Configuration.
- On tablet-sized layouts, the overlay side panel also keeps these editors
  inside the panel. Back or Escape returns to the selected information tab.
- Competition access, rules, appearance and pauses belong to **Settings** in the
  main row. Voter lists and vote activity belong to **Votes**.
- Information tabs support ArrowLeft, ArrowRight, Home and End. Mobile confines
  focus to the open panel and returns focus to its opener when it closes.
- Scroll the panel content normally. A short or canceled header drag returns
  the panel to its open position; horizontal gestures do not dismiss it.

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
