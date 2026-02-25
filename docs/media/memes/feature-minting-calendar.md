# Memes Minting Calendar

## Overview

The Memes minting calendar gives users a single place to track upcoming mints,
browse historical and future mint windows, and export mint events to personal
calendar tools. The same next-mint card is also reused as a fallback panel on
The Memes card/distribution routes when full card or distribution data is not
available yet.

## Location in the Site

- Full route: `/meme-calendar`
- Navigation path: `Network -> Memes Calendar` in both desktop and small-screen
  sidebar navigation.
- Shared next-mint panel: rendered on `/the-memes/{id}` when card data cannot
  be resolved for a numeric `{id}`.
- Shared next-mint panel: rendered on `/the-memes/{id}/distribution` when
  distribution data is not yet available for a valid numeric card id.

## Entry Points

- Open `Network` in sidebar navigation, then select `Memes Calendar`.
- Open `/meme-calendar` directly.
- Open a numeric `/the-memes/{id}` route for a card that is not yet available.
- Open a numeric `/the-memes/{id}/distribution` route before distribution data
  is published.

## User Journey

1. Open `/meme-calendar`.
2. Choose `Local` or `UTC` to control how times are displayed.
3. Read the top `Next Mint` card for mint number, date/time, division labels,
   and live countdown.
4. Use `Next Mint` or `Meme #` input to jump to a specific mint in the top
   card.
5. Use calendar icons to add mint events to ICS or Google Calendar.
6. Use the full calendar controls to switch zoom (`SZN`, `Year`, `Epoch`,
   `Period`, `Era`, `Eon`), move forward/back, jump to today, jump by mint
   number, or jump by month.
7. Hover/tap mint days to open details, event-link controls, and schedule
   override notes when a mint uses a non-standard date.
8. On fallback routes (`/the-memes/{id}` and `/the-memes/{id}/distribution`),
   the shared panel preselects the mint/card number from the URL.
9. On fallback routes, the shared panel is read-only: no `Next Mint` jump
   button, no `Meme #` input, and no full upcoming-mints table.

## Common Scenarios

- Check whether the next mint is upcoming, live, or past.
- Review remaining mints for the current season (or auto-forwarded next season
  when needed).
- Jump directly to a mint number and inspect its SZN/Year/Epoch/Period/Era/Eon
  placement.
- Export a mint event to ICS or Google Calendar from either the top card or day
  tooltip.
- Compare `Local` and `UTC` views for the same mint when coordinating across
  time zones.
- Check tooltip notes on override dates to understand why a mint appears on an
  off-schedule day.
- Open a future numeric `/the-memes/{id}` URL and read schedule/timer details
  for that specific card number.
- Open `/the-memes/{id}/distribution` before distribution data exists and still
  check the mint timing panel.
- Inspect upcoming mint timeline details programmatically from
  `/api/meme-calendar/{id}`.

## Edge Cases

- The upcoming-mints table omits the canonical next mint when it is already
  shown in the left `Next Mint` card.
- If the upcoming list only contains the canonical next mint already shown in the
  left card, the season table rolls forward to the next season and shows
  `Upcoming SZN`.
- If there are no remaining upcoming mints in the selected season, the section
  shows `No upcoming mints in this season.`.
- Historical launch period (SZN1 / Year 0) is grouped as `Memes #1 - #47`
  across calendar views.
- The month jump field is hidden on small screens.
- Day-tooltips auto-position near calendar edges (`top`, `right`, or `bottom`)
  and wrap text to keep notes and invite links readable on smaller screens.
- In native app/Capacitor sessions, screenshot controls are hidden in the full
  `/meme-calendar` top controls.
- In shared fallback panels, a screenshot icon remains visible beside the panel
  heading.
- During Europe/Athens daylight-saving transitions, UTC/local renderings for
  mint windows can shift by one hour even when the underlying Athens
  wall-clock mint schedule does not change.
- Non-positive or invalid mint-number input is ignored.
- Non-integer `/the-memes/{id}` routes show a `MEME` not-found screen.
- Non-positive or non-integer `/the-memes/{id}/distribution` routes show a
  `DISTRIBUTION` not-found screen.
- `/about/memes-calendar` is not a supported route; use `/meme-calendar`.

## Failure and Recovery

- If Google Calendar popups are blocked, allow popups for the site or use the
  downloadable ICS file instead.
- If screenshot export fails, no inline recovery message is shown; retry the
  action or capture the panel with OS screenshot tools.
- `/api/meme-calendar/{id}` returns:
  - `400` for invalid/non-positive IDs.
  - `422` when timeline resolution fails for the provided ID.
- If a fallback route opens a not-found screen, replace `{id}` with a valid
  numeric card id or open `/meme-calendar` directly.
- If timezone output is unclear, switch between `Local` and `UTC` to compare
  rendered times.
- `/api/meme-calendar/{id}` returns:
  - `200` with resolved details when the mint id is a valid positive integer
    and timeline lookup succeeds:
    - `mint_date` (`ISO UTC` timestamp, e.g.
      `2025-03-18T13:00:00.000Z`)
    - `season`
    - `year`
    - `epoch`
    - `period`
    - `era`
    - `eon`
  - `400` for invalid ids (`"abc"`, `"0"`, `"1.5"`, negative ids, and ids above
    JavaScript `MAX_SAFE_INTEGER`), with
    `{"error":"Invalid id. Use a positive integer in /api/meme-calendar/<id>."}`.
  - `422` when the id is valid but timeline data cannot be resolved, with
    `{"error":"Unable to resolve calendar details for this mint id. The id may be out of range."}`.

## Limitations / Notes

- Mint scheduling follows Monday/Wednesday/Friday cadence with explicit
  skip/extra/reschedule override days.
- Mint start/end instants are anchored to Europe/Athens wall-clock schedule
  before conversion to `Local`/`UTC` display, including regular DST offset
  changes.
- Calendar and API outputs are informational schedule views, not wallet
  eligibility checks.
- Date jump is month-level only, not exact day-level input.
- Shared fallback panels always use `Local` time and the URL-provided card id;
  they do not expose timezone toggles or mint-picker controls.

## Related Pages

- [Media Index](../README.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [Now Minting Countdown](feature-now-minting-countdown.md)
- [The Memes Mint Flow](feature-mint-flow.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Docs Home](../../README.md)
