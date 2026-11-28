# Wave Information Panel

## Overview

Wave information lives in **About**, **REP**, and **Configuration**. Desktop
shows these sections in the right sidebar. Mobile shows the same sections in a
dismissible panel over the current wave view.

## Location in the Site

Wave threads on `/waves/{waveId}` and `/messages/{waveId}`, including selected
decision routes.

## Entry Points

Select the wave name to open **About**. On phones the conversation avatar opens the same view; its score badge is display-only. Select **Score** in About statistics for the breakdown and **Learn more**. Desktop also provides **Show right
sidebar**. About includes the creator, creation date, share control, and current
pinned drop with its content and media. The pinned post uses a compact avatar,
author name, and timestamp. Eligible viewers can add or edit REP.
Pinned storms keep their reactions clearly separated from the part navigation.

Header search, clock, and sidebar toggles use transparent, borderless icon
buttons with a dark hover surface and visible blue keyboard focus. The open
sidebar toggle stays blue. Create wave and Join keep white primary styling;
Joined and other secondary actions retain their borders and dark surfaces.
Pin and mute use matching compact dark button surfaces.

## User Journey

1. Open a wave and select its name.
2. Read About or switch to REP or Configuration.
3. On phones, use the Back chevron or swipe right to return to the original
   view. Sub-pages slide in from the right and use the same single Back control
   to go up one level. Unsaved edits ask **Discard changes?** before leaving.
   The decision, tab, curation, scroll and unfinished input remain in place.
   Tablet panels also offer Close and backdrop dismissal.

## Common Scenarios

- The section order is About, REP, Configuration. Desktop and mobile use the
  same compact pill styling for these sections.
- In REP, Total and the contributor count share the widest summary block, with
  Positive, Negative, and Your REP in separate blocks below. Activity puts each
  rater and signed change above the category, previous and new ratings, and time.
  Contributors and Activity use pill buttons. Category search filters categories;
  select one to view its contributors.
- Configuration owns wave access, chat availability, links, slow mode, replies,
  curation management, chat history deletion and personal display preferences.
- Chat setting rows use spacing without individual divider lines; section
  dividers remain. Empty Guidelines has no extra line below its heading.
  Boosted-drop display choices have a borderless container and quiet dark
  unselected options; the selected option keeps its blue indication.
- On phones, editable Configuration rows keep their settings gear and open
  with a tap on the gear or anywhere on the row. Chat status, Links, the two Replies
  options, and administrator message deletion use inline switches that save
  immediately. Turning chat off requires confirmation. Failed saves leave the
  previous value visible for retry. Permission and authentication checks still apply.
- Access rules, slow mode and Guidelines keep their editors and Save controls.
  Back, Escape, device Back and a rightward swipe go up one level. There is one
  Back arrow and no duplicate in-content Cancel. Unsaved forms ask before
  discarding. The selected information tab and its scroll position remain intact.
- Select the Joined count in phone About to push a Members page. Rename opens
  with the field focused and keeps Save.
- On phones inside a wave, `+ Curation` at the end of the wave tab row and
  Configuration's Create curation control open the same
  shorter bottom sheet. New subwave opens a tall bottom sheet for its steps.
  Each sheet slides up with one title and an X Close control at the top right.
  Dragging cannot dismiss the creation forms. Close, outside dismissal and Back
  protect entered drafts and ask before discarding. Criteria pages use one Back
  header. Profile curation and ordinary new-wave dialogs keep their existing presentation.
- In Curations, the section plus opens Create curation. A row's management
  control includes Edit Curation. Desktop and tablet keep their existing
  information-panel forms and controls. Failed saves keep drafts for retry.
- Delete all my messages confirms in a sheet with a red destructive action.
- On tablet-sized layouts, the overlay side panel also keeps these editors
  inside the panel. Back or Escape returns to the selected information tab.
- An open side panel fills the viewport when the browser becomes narrower than
  768 px. Its selected information tab and access-editor draft stay in place;
  widening the browser restores the side-panel width.
- Decision access, rules, appearance and pauses belong to **Settings** in the
  main row. Voter lists and vote activity belong to **Votes**.
- Information tabs support ArrowLeft, ArrowRight, Home and End. Mobile confines
  focus to the open panel and returns focus to its opener when it closes.
- Scroll the panel content normally. A short or canceled header drag returns
  the panel to its open position. Phone horizontal swipes go back.

## Edge Cases

- A section that becomes unavailable falls back to About.
- Opening information does not change the wave route or selected decision.
- Missing wave data prevents the information content from rendering.

## Failure and Recovery

Close the panel and reopen it after reloading the wave if wave information could
not load. Decision-resource errors can be retried in their own main view.

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
- [Wave Leaderboard Results Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
