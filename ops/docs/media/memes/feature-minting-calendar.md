# Memes Minting Calendar

## Overview

`/meme-calendar` is the main schedule view for upcoming and past The Memes mint
windows. It combines:

- A top `Next Mint` panel with countdown/status states, timeline labels, and
  calendar export links.
- A lower calendar with zoom levels (`SZN`, `Year`, `Epoch`, `Period`, `Era`,
  `Eon`) and jump controls.

The same top panel is reused as a compact fallback on unresolved card and
distribution routes.

## Location in the Site

- Full route: `/meme-calendar`
- Navigation path: `Network -> Memes Calendar` in desktop and small-screen
  sidebars.
- Shared fallback panel on `/the-memes/{id}` when `{id}` is an integer but no
  published card data resolves.
- Shared fallback panel on `/the-memes/{id}/distribution` when `{id}` is a
  valid positive integer and distribution data is still empty/unpublished.

## Entry Points

- Open `Network -> Memes Calendar`.
- Open `/meme-calendar` directly.
- Open an unresolved integer `/the-memes/{id}` route.
- Open a valid positive integer `/the-memes/{id}/distribution` route before
  distribution rows are available.

## User Journey

1. Open `/meme-calendar`.
2. Switch between `Local` and `UTC`.
3. Read the top panel:
   - Heading changes by state: `Next Mint`, `Upcoming Mint`, `Mint Live`, or
     `Past Mint`.
   - Card shows mint number, datetime, full SZN/Year/Epoch/Period/Era/Eon
     labels, and a live countdown.
4. Use top controls to jump:
   - `Next Mint` button.
   - `Meme #` input (submit with Enter).
5. Export the selected mint using ICS or Google Calendar icons.
6. Use the lower calendar controls:
   - Change zoom (`SZN`, `Year`, `Epoch`, `Period`, `Era`, `Eon`).
   - Move backward/forward.
   - `Jump to Today`.
   - `Meme #` jump.
   - `Date` month jump (`Date` input is hidden on small screens).
7. Open mint-day cells to view details, export links, and any override note.
8. On fallback routes, the compact panel auto-selects the URL id and stays
   local-time read-only (no timezone toggle, no `Next Mint` button, no `Meme #`
   input, no upcoming table).

## Common Scenarios

- Check whether the canonical next mint is upcoming, live, or already past.
- Jump to a specific mint number and inspect its full timeline placement.
- Export any upcoming mint to calendar from the top panel or day tooltip.
- Compare `Local` vs `UTC` renderings for cross-time-zone coordination.
- Open unresolved future card URLs and still see timing details in the fallback
  panel.
- Open early distribution URLs and still see the same fallback timing panel
  above the "Distribution Plan will be made available soon!" message.
- Query `/api/meme-calendar/{id}` for a mint timeline summary.

## Edge Cases

- Upcoming table removes the canonical next mint when that mint is already shown
  in the left panel.
- If that removal empties the current-season table, the table rolls forward and
  header changes to `Upcoming SZN`.
- If a season table has no upcoming rows, it shows
  `No upcoming mints in this season.`.
- Year 0 launch period is grouped as `Memes #1 - #47` in higher-level views.
- Day tooltips auto-place (`top`, `right`, `bottom`) near viewport edges.
- In Capacitor/native sessions, screenshot control is hidden on full
  `/meme-calendar` top controls.
- In compact fallback panels, screenshot control remains visible next to the
  heading.
- DST transitions for Europe/Athens can move rendered UTC/local times by one
  hour while wall-clock mint windows stay on Athens schedule.
- Invalid or non-positive top-panel/calendar `Meme #` input is ignored.
- `/the-memes/{id}` behavior:
  - Non-integer ids show `MEME` not-found.
  - Integer ids that do not resolve (including `0` or negative integers) show
    the fallback panel.
- `/the-memes/{id}/distribution` behavior:
  - Non-positive or non-integer ids show `DISTRIBUTION` not-found.
- `/about/memes-calendar` is unsupported; use `/meme-calendar`.

## Failure and Recovery

- If Google Calendar is blocked, allow popups for the site or use ICS download.
- If screenshot export fails, the UI shows no inline error; retry or use OS
  capture.
- If a route shows not-found, correct `{id}` format:
  - `/the-memes/{id}` requires an integer for fallback mode.
  - `/the-memes/{id}/distribution` requires a positive integer.
- If timing looks wrong, switch `Local`/`UTC` to compare output.
- `/api/meme-calendar/{id}` responses:
  - `200` for valid ids, with:
    - `mint_date` as `YYYY-MM-DD` (UTC day string, for example
      `2025-03-18`)
    - `season`, `year`, `epoch`, `period`, `era`, `eon`
  - `400` for invalid ids (non-numeric, `0`, decimals, negatives, or above
    JavaScript `MAX_SAFE_INTEGER`):
    - `{"error":"Invalid id. Use a positive integer in /api/meme-calendar/<id>."}`
  - `422` when the id parses but timeline resolution fails:
    - `{"error":"Unable to resolve calendar details for this mint id. The id may be out of range."}`

## Limitations / Notes

- Schedule is based on Monday/Wednesday/Friday cadence plus explicit
  skip/extra/reschedule overrides.
- Mint start/end are anchored to Europe/Athens wall-clock timing before
  rendering in local or UTC display modes.
- Calendar/API output is schedule information, not wallet eligibility.
- `Date` jump is month-level only.
- Compact fallback panels are intentionally limited to local-time next-mint
  context.

## Related Pages

- [Media Index](../README.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [The Memes Mint Flow](feature-mint-flow.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Docs Home](../../README.md)
