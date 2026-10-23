# Home Waves Discovery

## Overview

After `Coming up` on `/`, the `Tired of bot replies?` section introduces Waves
and shows up to six active waves. The homepage no longer includes a Boosted
Drops section. Boosting and boosted-drop preferences inside Waves are unchanged.

## Location and Entry Points

- Open `/` and scroll below `Coming up`.
- `View all` opens `/waves`.
- Each card opens `/waves/{waveId}`, or `/messages/{waveId}` for a direct-message
  wave. The entire card is one keyboard-accessible link.

## Layout and Content

- The existing Waves card design is retained. Below `768px`, its image fills
  the left third and the name, activity, description, and scores sit on the right.
  From `768px`, the cover sits above the details with its existing gradient.
- Relative last-drop time and total drops appear beneath the name. A wave with
  no activity shows `No drops yet`.
- Descriptions are plain text from the wave description drop, not the latest
  chat message. One line is visible on mobile and up to two from `768px`;
  links and media inside the description are not interactive previews.
- Labelled Score, Hot, and REP values remain at the bottom, separated by a
  subtle line. Missing metrics remain omitted according to the existing data.
- The grid has one column below `640px`, two from `640px`, and three from
  `1024px`.
- Section headings are 28px on mobile and 38px from `768px`. `View all` is an
  underlined text action below the subtitle on mobile and beside it on desktop.
- Cards use a short border-colour transition without lifting or zooming.
  Keyboard focus remains visible; reduced motion disables transitions and
  arrow movement.
- The homepage footer keeps all social, legal, API, contact, and status links,
  with wrapping rows and bottom safe-area spacing.

## Loading, Empty, and Error States

- Six matching skeleton cards appear while the request loads.
- Empty or failed requests hide the section. Refresh `/` to retry, or open
  `/waves` directly.
- A missing description keeps the card spacing and its wave navigation.

## Limitations

- Discovery data and ranking are unchanged by the homepage styling.
- The dedicated `/discover` route keeps its existing layout and description
  preview, up to 20 results, and backend exclude-followed filtering.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Wave Discover Cards](../waves/discovery/feature-discover-cards.md)
- [Waves Index](../waves/README.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../README.md)
