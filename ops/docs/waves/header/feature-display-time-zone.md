# Display Time Zone

## Overview

Times in waves, direct messages, decisions and notifications render in the
viewer's own time zone by default. Post times are public, so a screenshot that
shows a local clock time lets anyone work out the viewer's UTC offset. Viewers
can show times in UTC or another time zone instead, either as a saved setting
or for one browser tab.

Any time that is not in the device's own zone carries its zone name, such as
`05:06 PM UTC` or `06:06 PM GMT+1`, so readers of a screenshot are never
misled. Relative times such as `4m` or `3h` are unchanged.

## Location in the Site

- Setting: `Preferences` > `Time Zone` (`/preferences?tab=time-zone`). It works
  signed out because the choice is saved on the device.
- Wave switch: `More wave actions` in the desktop/tablet Wave conversation
  header, alongside the eligible gallery/chat action. Direct messages retain
  their clock button. On compact web headers it is an item in the header's
  overflow menu. On phones, including the native app, it is also an item in the
  menu that opens when you press and hold a post.

## Setting

`Show times in` offers:

- `Local time`: the device zone (the default). The option names the zone and
  the current time.
- `UTC`: the same for everyone; times in 6529 do not show the viewer's zone.
- `Another time zone`: search by city or zone name, such as `Lisbon` or
  `Europe/Lisbon`. No match shows a message with an example.

The setting is saved on this device only, not with the profile, so each device
keeps its own choice. A preview shows the current time in the chosen zone.
Changing the setting turns the wave switch off.

## Wave Switch

1. Open `More wave actions` in a desktop/tablet Wave header (or the clock in a
   direct-message header).
2. Choose `UTC` (or `Local time` when the setting already is UTC). When the
   setting is a named zone, the first option shows it as `{City} · your
setting`.
3. While the switch is on, a `Times in UTC` chip stays visible in the header.
   Select the chip to change it, or `×` to show times in the saved setting
   again.

The switch lasts until the tab or the app is closed, then times go back to the
saved setting. It applies to every wave, direct message and decision in that
tab. Choosing an option announces `Times now shown in {zone}` to screen
readers.

Opening desktop/tablet `More wave actions` keeps focus on its trigger instead of
automatically focusing a time option. Press Tab to enter the controls; keyboard
focus remains visible, and Escape closes the popover.

On compact headers and in the press-and-hold post menu on phones, the menu
offers `Show times in UTC for now` and, while on, `Show times in {setting}
again`. Phones show no chip in the header; converted times carry their zone
name, such as `UTC`.

## What Follows the Display Zone

- Post-header times, grouped-row times, quoted posts and the single-post view.
- `Yesterday`, short dates and the narrow-screen date-only labels, which flip at
  the display zone's midnight.
- Encrypted direct-message times, day separators, tooltips, the conversation
  list and search.
- Decision timelines, deadlines, phase tooltips, winner badges, submission
  tooltips and the next-result line in the wave list.
- Wave search results, link previews (X, ENS, Etherscan, marketplace),
  notifications and list "Yesterday" labels.
- `Copy text` and select-and-copy across posts.
- The wave score result and its PNG export, and the legacy direct-message
  export.

Wave creation keeps dates in the author's own zone while they set up
decisions.

## Limits

- The phone status bar and the desktop clock still show local time in an
  ordinary screenshot.
- Posting times over time can still suggest a viewer's waking hours.
- Clock style (12-hour or 24-hour) and date order follow the browser.

## Related

- [Profile Privacy and Notification Preferences](../../notifications/feature-profile-preferences.md)
- [Wave Header Controls](feature-wave-header-controls.md)
