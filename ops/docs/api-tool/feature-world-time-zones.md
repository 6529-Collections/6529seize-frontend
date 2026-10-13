# World Time Zones

## Overview

`/tools/time-zones` shows the current local time and UTC offset across the
world.

- A live UTC clock and the viewer's own time zone.
- A world map with every time-zone polygon colored by its current UTC offset,
  with an optional night-side shading.
- A searchable, sortable table of every IANA time zone with its region, UTC
  offset, local time and daylight saving status.

Times, offsets and zone names come from the browser's copy of the IANA Time
Zone Database through `Intl`. The page has no hard-coded offsets or daylight
saving rules, and it makes no API requests.

## Location in the Site

- Route: `/tools/time-zones`
- Tools index: `Builder Tools -> World Time Zones`
- Web sidebar path: `About -> Data & Developer Tools -> World Time Zones`
- Native app drawer path: `About -> Data & Developer Tools -> World Time Zones`
- Header search lists it with the other About menu destinations.

## Entry Points

- Open `World Time Zones` from the Tools index or the About menu.
- Open `/tools/time-zones` directly.

## User Journey

1. Read the UTC clock (updates every second) and `Your time zone` (local time,
   zone name, UTC offset and IANA ID).
2. On the map, hover, tap or focus a zone. `Selected zone` shows its name, IANA
   zone, local time and date, UTC offset, daylight saving status, and how many
   other IANA zones share the same clock. The viewer's zone is selected by
   default and has a dashed outline.
3. Optional: turn `Shade the night side` on or off.
4. In `All time zones`, search by city, IANA zone, region, zone name, or
   offset, or sort by `Zone`, `Region` or `UTC offset`.
5. Select `Show all {count} time zones` to expand the unfiltered list; a search
   always covers every zone.

## Map Details

- One polygon per distinct current clock. The boundary release merges zones
  whose clocks agree from its release date on, so, for example, Paris, Berlin
  and Madrid share one polygon. `Selected zone` names the representative IANA
  zone and the number of other zones that share its clock.
- Ocean areas use nautical `Etc/GMT±N` zones, so the whole globe is covered.
  Open ocean is drawn in a muted shade of the same colors (`Open ocean
(muted)` in the legend). Land zones use the full colors with darker
  borders, so boundaries on land, including half- and quarter-hour zones such
  as India and Nepal, stand out. Open ocean stays hoverable and focusable.
- Colors: zones behind UTC are blue, zones ahead of UTC are red, and UTC itself
  is neutral gray. Lighter colors are farther from UTC.
- The selected zone has a white outline on a dark halo; your own zone has a
  dashed outline.
- The night side is computed from the sun's current position and shaded, with
  a thin line marking the day/night boundary.

## Search and Sort Rules

- Text search ignores case and accents and matches every word against the city,
  IANA zone, region and localized zone name.
- Offset search is numeric: `+5` matches UTC+05:00, UTC+05:30 and UTC+05:45;
  `+5:30` or `UTC+05:30` matches exactly; `UTC` or `GMT` alone matches zero
  offset.
- Default sort is UTC offset, west to east. Select a column header again to
  reverse it.
- Daylight saving status is derived from the zone's offsets across the current
  year: `Daylight time` when the current offset is above the year's lowest
  offset, `Standard time` otherwise, and `No seasonal change` when the offset
  never changes.

## Keyboard and Screen Reader Use

- The map is a single-select list of zones and one tab stop. When it has
  focus, the arrow keys select the next zone west or east, and `Home` and
  `End` jump to the first and last zone. Movement always starts from the
  selected zone; hovering never moves it. The selected zone is announced with
  its name and UTC offset, and its outline gets heavier while the map has
  keyboard focus.
- After the arrow keys pause, screen readers also hear the selected zone's
  local time once.
- The table is the full text alternative to the map. Sortable headers announce
  their sort direction.
- After typing in the search field pauses, screen readers hear the updated
  result count. Minute-by-minute time updates are never announced.
- `Data sources` links open in a new tab and say so to screen readers.

## Live Updates

- One shared timer updates the page. Local times update on the minute
  boundary; only the small UTC clock ticks every second.
- Updates pause while the tab is hidden and catch up as soon as it is visible.
- Times render after the page loads in the browser. The server render shows
  stable placeholders.

## Failure and Recovery

- While the map data loads, the map area shows `Loading the map…`.
- If the map data fails to load, the map area shows an error with `Try again`.
  The table still works, using the browser's own list of time zones.
- Zones the browser's time-zone database does not include are shown in gray on
  the map, and their details explain that their time cannot be shown. The table
  leaves them out and states how many were skipped.
- If the browser does not report a time zone, `Your time zone` says so.

## Data Sources and License

- Time-zone boundaries: [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder),
  derived from OpenStreetMap data, © OpenStreetMap contributors, available
  under the Open Database License (ODbL) 1.0. The page credits the sources in
  its `Data sources` section.
- The simplified map data is bundled with the site and loaded only by this
  page. Its release, checksums, and regeneration steps are recorded in
  `components/tools/time-zones/data/README.md`.

## Limitations / Notes

- City names come from IANA zone IDs (for example `Sao Paulo` from
  `America/Sao_Paulo`); zone names, times and dates are localized by the
  browser.
- The map has one polygon per current clock, not one per IANA zone; the table
  lists every zone.
- Browsers may report a legacy zone ID (such as `Asia/Calcutta`). The page
  matches it to the current IANA name on the map and in the table.

## Related Pages

- [Tools Index](feature-tools-index.md)
- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Docs Home](../README.md)
