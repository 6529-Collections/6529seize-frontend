# Wave Content Tabs

## Overview

Wave pages can expose a tab strip that switches the main content panel between
wave sections such as `Chat`, `Leaderboard`, `Sales`, `Winners`, and other
wave-dependent views. Named curations also appear here: each opens a selected
collection of posts from the wave. The default competition shares this one row
with Chat, and its views render directly below it. A separately opened non-default
competition keeps its own detail navigation. See [Competitions](../competitions/feature-competitions.md)
for default selection and switching. **About** is the final wave tab, with the
competition’s **Configuration** immediately before it when a competition is
available. Native and legacy defaults share this ordering on desktop, mobile
web and the app.

In the `My Votes` tab, non-image drops use a preview image from drop metadata when available, so rows render quickly and stay stable in list form.
Each wave remembers its last selected valid tab in this browser or app. Ordinary
wave navigation restores that choice, including after a reload or reopening the
app. Main Stage can remember Leaderboard while Maybes Bar independently remembers
Chat. A wave with no valid remembered choice opens Chat. Background competition
loading does not change a deliberate selection.
Explicit tab, competition, curation and message links retain their destinations.
Browser Back/Forward and native app Back restore the section from that visit
when it is still available, ahead of the wave's latest remembered choice.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages with an active wave: `/messages/{waveId}`
- On desktop and mobile web, tabs appear below the wave header and above the
  main content panel.
- In the native app, curations appear alongside the main wave navigation tabs.

## Entry Points

- Open a wave from waves lists, profile wave links, or a shared wave URL.
- Open a direct message thread with a selected wave.
- Select a tab from the wave tab strip.
- Eligible wave admins can use the tab-row `+` menu on web and in the app to
  create a curation or, on root non-direct-message waves, create a subwave.

## User Journey

1. Open a wave.
2. A simple Chat wave without curations or other available sections can open
   directly in chat without a web tab strip. Admins still have the tab-row
   create actions.
3. If multiple sections are available, the tab strip appears and selects the
   active tab:
   - An ordinary wave visit restores its last selected valid tab. A first visit,
     or a visit without a valid saved choice, opens `Chat`, including Memes and
     completed competition waves on web and in the native app.
   - Loading or refreshing the default competition does not change deliberate
     Chat selections. A remembered competition view waits for its identity and
     availability to be checked before opening.
   - Explicit tab and competition links open their requested section. Native
     app Back restores the section from that visit when it is still available.
4. Select a tab to switch sections.
5. The main content panel updates. Competition views retain their competition
   ID and selected tab in the URL so reload and Back/Forward restore the view.
   When switching to a competition route, its controls appear after navigation
   completes, so a newly opened sort sheet or form stays in that view.
   App tabs and their content use the same availability rules. An unavailable
   legacy competition section opens `Leaderboard`, or `Submissions` after
   voting has ended, and selects that visible tab.
6. When open polls still need the signed-in user's answer and the user can
   respond, the `Polls` tab shows an unread-style count badge.
7. On the `My Votes` tab, each voted drop entry can show a preview thumbnail and
   an inline media format badge when that drop includes media metadata.
   For non-image media, that thumbnail comes from a `preview_image` metadata value
   when present, and media interactions stay disabled in the row.
8. If the active tab is no longer valid when entering a new wave, the active tab
   resets to Chat.
9. Eligible admins can open the `+` menu and select `New subwave`. The new
   subwave starts with the parent wave's admin group, which can still be changed
   in the `Groups` step before submission.
10. Select a named curation tab to show its posts. Select another curation to
    switch collections, or a regular wave tab such as `Chat` to leave the
    curation view. The same navigation is available to viewers and admins.

## Common Scenarios

- Switch between `Chat` and `Leaderboard` while a wave is active.
- Open `Winners` once the first decision has passed.
- In memes waves, move between `Leaderboard`, `My Votes`, `FAQ`, and other
  available tabs.
- In curation waves, move between `Chat`, `Leaderboard`, `Sales`, `Winners`,
  and `My Votes` as those tabs become available.
- In the `My Votes` tab, users can quickly scan entries by format: image,
  video, or interactive media is indicated with a small badge at the title row.
- In `My Votes`, non-image drops show a static preview thumbnail in the row when
  `preview_image` metadata is valid.
- Select Leaderboard in Main Stage, open Maybes Bar and select Chat, then return
  to Main Stage through the wave list: Leaderboard reopens. Returning to Maybes
  Bar reopens Chat. Explicit section links retain their own destinations.
- In the native app, open an author profile from Leaderboard and use Back to
  return to Leaderboard. Repeated profile visits preserve the same behavior.
- A link targeting a specific chat message still opens Chat, even when it also
  names another section.
- Polls can allow every reader to respond or limit responses to people who can
  chat. Readers who cannot respond still see poll results, but vote controls are
  hidden.
- Eligible readers can use `View results` on an open unanswered poll to inspect
  counts and percentages before voting, then return to `Vote` while the poll is
  still open.
- On mobile, the fixed `+` control stays outside the horizontally scrolling tab
  list so both `New curation` and `New subwave` remain reachable on narrow
  screens.
- On narrow web layouts, an edge fade and chevron appear when additional tabs
  are available off-screen. The cue follows the current scroll position and can
  be tapped to move through the tab row.
- When many curations overflow the row, scroll horizontally to reach them.
  Touch layouts support swiping the tab row, and the active tab scrolls into
  view.
- A shared wave URL with a valid `?curation={curationId}` opens that curation
  directly.

## Edge Cases

- Chat waves with curations show their curation tabs. A single curation remains
  a named tab; waves with none have no curation tabs.
- `Leaderboard` can disappear after voting has ended for a wave.
- Each wave's remembered choice survives background loading, reloads and app
  restarts in the same browser or app. Clearing local browser/app data removes it.
- A remembered competition view is scoped to the competition where it was
  selected. If another competition has become the default, an ordinary wave
  visit falls back to Chat. Explicit links to the earlier competition still
  retain their destination.
- `Winners` is shown only after the first decision has passed.
- `Sales` appears in curation waves only.
- `My Votes` appears in memes and curation waves; `FAQ` appears in memes waves
  only.
- Tabs expose selected-state semantics and link to the active content panel for
  assistive technologies.
- Mobile tab-scroll controls have direction-specific accessible names, remain
  keyboard operable, and avoid smooth motion when reduced motion is requested.
- Memes wave tabs start with `Chat`, then `Leaderboard` (or `Submissions` after
  voting ends), `Winners` when available, and `My Votes` for signed-in users.
  Other available sections follow these tabs.
- Curation waves do not expose an `Outcome` tab; `Sales` fills that dedicated
  results-slot instead.
- In `My Votes`, non-image rows suppress inline media interaction even when the row
  includes video, audio, or HTML media.
- If `preview_image` is missing or invalid, the row still shows the drop by using
  its standard media source and keeping interaction disabled.
- `New subwave` is unavailable in direct messages, inside an existing subwave,
  while using a profile proxy, when the parent has no reusable admin group, or
  when the signed-in profile is not eligible to administer the parent.

## Failure and Recovery

- If a selected tab becomes unavailable because wave state or permissions change,
  the wave falls back to Chat. A completed legacy Leaderboard uses Submissions.
- If a previously stored tab is no longer available for that wave, the UI falls
  back to the wave default.
- If a saved or active `Sales` tab is revisited in a non-curation context, the
  UI falls back to that wave's first available tab.
- If an unavailable tab is requested, tab state falls back to that wave’s first
  available tab: Chat for a wave, or Leaderboard/Submissions for competition detail.
- If a wave becomes chat-only with no curations or other available sections,
  the web tab strip can be hidden and the chat panel remains available.
- If a linked curation was deleted or does not belong to this wave, the wave returns
  to its regular view once the available curations load successfully. The stale
  `curation` parameter is removed without changing other URL parameters.
- Loading or a failed curation request does not discard a linked curation.
- If a `My Votes` row has no preview media available, users still get row metadata
  (title, author, and vote score) and can open the drop.
- If metadata parsing for `preview_image` fails, `My Votes` entries continue to render
  with the row’s media source and remain navigable to the drop detail.
- If the inherited admin group cannot be loaded for display, submission still
  keeps its known group ID; the Groups step may temporarily label it as
  `Selected group`.

## Limitations / Notes

- Tab preferences are local to this browser or app and do not sync between
  devices. Named curation selection is encoded in the wave URL as
  `?curation={curationId}`.
- Available tabs depend on wave type, curation settings, voting state, and
  first-decision status.
- The app and web layouts present the tab row differently, but eligible root
  wave admins receive the same curation and subwave create actions.

## Related Pages

- [Wave Chat Index](README.md)
- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Wave Sales Tab](../leaderboard/feature-sales-tab.md)
- [Wave Winners Tab](../leaderboard/feature-winners-tab.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave My Votes Tab](../leaderboard/feature-my-votes-tab.md)
- [Docs Home](../../README.md)
