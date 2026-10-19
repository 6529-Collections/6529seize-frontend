# Home Boosted Drops and Most Active Waves

## Overview

After `Coming up` on `/`, home shows two discovery sections:

- `Boosted Drops` with subtitle `Community-boosted right now`
- `Most active waves` under the headline
  `Tired of bot replies? Join the most interesting chats in crypto`

Use this page to verify what these grids show, where each action routes, and
why a section can disappear.

## Location in the Site

- Route: `/`
- Boosted card actions:
  - Card click: `/waves/{waveId}?serialNo={serialNo}` or
    `/messages/{waveId}?serialNo={serialNo}` for direct-message waves
  - Author link: `/{handle}` when a handle exists
  - Author fallback: shows `Anonymous`; no profile route is available
  - Wave link: `/waves/{waveId}`
- Most active waves actions:
  - Card click: `/waves/{waveId}` or `/messages/{waveId}` for
    direct-message waves
  - `View all`: `/waves`

## Entry Points

- Open `/` and scroll below `Coming up`.

## User Journey

1. `Boosted Drops` loads from the boosted feed:
   - While loading: section stays visible with `Loading...`.
   - When data is ready: cards render in a responsive grid. Card placeholders
     can appear briefly while previews load; other home sections stay usable.
   - If the request fails or returns no cards: section is hidden.
2. Users select a boosted card to open that drop in wave chat context.
3. `Most active waves` loads hot waves:
   - While loading: six skeleton cards render.
   - When data is ready: up to six cards render with wave metadata.
   - Below `768px`, the image fills the left third of each card and stretches
     its full height, with the name, description, labelled scores, and activity
     metadata on the right.
     Names and description previews use one line. The grid has one
     column below `640px` and two columns from `640px`.
   - From `768px`, cards place details below the image, with a gradient that
     blends the bottom of the image into the card. From `1024px`, the grid has
     three columns.
   - If the request fails or returns no waves: section is hidden.
4. Users select a wave card to open that wave, or use `View all` to open
   `/waves`.

## Common Scenarios

- Homepage cards use a short border-colour transition without lifting or
  zooming artwork. Wave titles highlight on hover and keyboard focus.
- From `768px`, both homepage `View all` buttons share the outlined treatment of
  `Connect wallet`, with a softer resting border and a stronger border on hover,
  and have a small arrow movement. Reduced-motion settings disable movement and
  transitions while preserving visible focus feedback.
- Both `Coming up` and the waves section place `View all` in the section header.
  On small screens it is a plain text link with an arrow beside the title,
  leaving clear space above the subtitle. From `768px` it becomes a compact
  bordered button on the right. The waves list ends with its last card, without
  a second action beneath it.
- Section headings use matching sizes, and wave cards use larger rounded corners
  with a subtle border. The site footer separates its wrapping links with space
  and adds bottom spacing for devices with a safe area.

- Boosted grid card limits:
  - Mobile (`<640px`): up to 6 cards
  - Tablet (`640px-1023px`): up to 6 cards
  - Desktop (`>=1024px`): up to 9 cards
- Boosted card with profile fallback:
  - Footer shows `Anonymous` when the author has no handle.
- Most active waves card with recent activity:
  - Shows relative last-drop time and drops count directly below the wave name.
  - Shows the description as plain text, without Markdown formatting: one line
    below `768px`, up to two lines on larger layouts, aligned to the top.
  - Keeps labelled Score, Hot, and REP metrics at the bottom of the card,
    separated from the description by a subtle line.
- Most active waves card with no activity:
  - Shows `No drops yet`.
- Most active waves card with activity but no description content:
  - Keeps the activity metadata row.
  - Keeps the card layout aligned with the other wave cards.

## Edge Cases

- Most active waves preview snippets are read-only; links are not clickable in
  the compact preview row.
- Preview content comes from the wave description drop, not the latest chat
  message.
- If the description drop has no usable text, the card keeps its spacing and
  still opens the wave route. Image and media previews are omitted here.
- Cards can route to `/messages` for direct-message waves.

## Failure and Recovery

- If either section is missing, refresh `/` to re-run section queries.
- If card navigation is unavailable, open `/waves` and navigate from there.
- If a boosted deep-link fails, open `/waves/{waveId}` or
  `/messages/{waveId}` and find the drop in chat history.

## Limitations / Notes

- `Boosted Drops` has no `View all` action on the homepage.
- `Most active waves` is capped to six cards on home.
- The dedicated `/discover` route keeps its own description preview and
  metadata layout, with up to 20 results, no subtitle, no footer link, and
  backend exclude-followed filtering.
- Boosted ranking uses a recent boost window and updates while the page stays open.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Wave Discover Cards](../waves/discovery/feature-discover-cards.md)
- [Waves Index](../waves/README.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../README.md)
