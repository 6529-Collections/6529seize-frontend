# World Time Zones

## Overview

`/tools/time-zones` shows the current local time and UTC offset across the
world.

- A live UTC clock and the viewer's own time zone.
- A world map with one dot per IANA time zone at its principal city, colored
  by the zone's current UTC offset, with an optional night-side shading.
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
2. On the map, hover, tap or focus a dot. `Selected zone` shows its city, zone
   name, IANA zone, local time and date, UTC offset and daylight saving
   status. The viewer's zone is selected by default and has a dashed ring.
3. Optional: turn `Shade the night side` on or off.
4. In `All time zones`, search by city, IANA zone, region, zone name, or
   offset, or sort by `Zone`, `Region` or `UTC offset`.
5. Select `Show all {count} time zones` to expand the unfiltered list; a search
   always covers every zone.

## Map Details

- The map shows land outlines in an Equal Earth projection, with faint lines at
  the edges of the 24 nautical time-zone bands.
- Each dot is one IANA zone at its principal location from the time-zone
  database (`zone1970.tab`), for example Kolkata for `Asia/Kolkata`. Dot colors
  follow the zone's current UTC offset and change on their own when daylight
  saving starts or ends.
- Zones without a location of their own, such as `Etc/` zones and alias names
  like `Europe/Amsterdam`, appear in the table and clocks but have no dot. A
  viewer whose browser reports an alias is matched to the dot of the zone it
  links to.
- Colors: UTC is light gray, zones behind UTC are blue and zones ahead of UTC
  are red, darker the farther they are from UTC. Every dot has a light ring so
  it stays visible on land, sea and the night side.
- Hover or tap picks the nearest dot within reach, so dots stay easy to hit
  where they are close together. In dense areas, such as Indiana or Argentina,
  the table and the keyboard reach every zone.
- The selected zone has a white ring on a dark halo; your own zone has a dashed
  ring.
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
- Zones the browser's time-zone database does not include are shown as gray
  dots, and their details explain that their time cannot be shown. The table
  leaves them out and states how many were skipped.
- If the browser does not report a time zone, `Your time zone` says so.

## Data Sources

- Land outline: [Natural Earth](https://www.naturalearthdata.com/) 1:50m land,
  public domain.
- Zone locations and alias names: the
  [IANA Time Zone Database](https://www.iana.org/time-zones), public domain.
- The page credits both in its `Data sources` section.
- The simplified map data is bundled with the site and loaded only by this
  page. Its versions, checksums and regeneration steps are recorded in
  `components/tools/time-zones/data/README.md`.

## Limitations / Notes

- City names come from IANA zone IDs (for example `Sao Paulo` from
  `America/Sao_Paulo`); zone names, times and dates are localized by the
  browser.
- The map marks each zone's principal city, not its boundaries.
- Browsers may report a legacy zone ID (such as `Asia/Calcutta`). The page
  matches it to the current IANA name on the map and in the table.

## Related Pages

- [Tools Index](feature-tools-index.md)
- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Docs Home](../README.md)
