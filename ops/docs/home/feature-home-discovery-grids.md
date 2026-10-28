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

- Below `768px`, the wave cover occupies the left third of each homepage card,
  beside its content. From `768px`, the cover fills the card behind a dark, image-tinted fade
  that keeps the text readable. The tint comes from a small, cached sample of the
  loaded cover; unreadable pixels keep the Iron fallback. Homepage mobile does not sample
  images. Discover uses the same overlay design at every breakpoint.
- Relative last-drop time and total drops appear beneath the name. A wave with
  no activity shows `No drops yet`.
- Descriptions are plain text from the wave description drop, not the latest
  chat message. One line is visible at each
  breakpoint; links and media inside the description are not interactive previews.
  There is no message-author row and no additional drop request.
- Labelled Score, Hot, and REP values remain at the bottom. A subtle line
  separates them on mobile. Missing metrics remain omitted according to the
  existing data.
- The grid has one column below `640px`, two from `640px`, and three from
  `1024px`.
- Section headings are 28px on mobile and 38px from `768px`. `View all` is an
  underlined text action below the subtitle on mobile and beside it on desktop.
- On desktop, hovering gently lifts the card and slowly zooms its cover; the
  wave name stays white. Mobile keeps its border feedback. Keyboard focus
  remains visible; reduced motion disables the lift, zoom, and transitions.
- The homepage footer keeps all social, legal, API, contact, and status links,
  with wrapping rows and bottom safe-area spacing.

## Loading, Empty, and Error States

- Six matching skeleton cards appear while the request loads.
- Empty or failed requests hide the section. Refresh `/` to retry, or open
  `/waves` directly.
- A missing description keeps the card spacing and its wave navigation.

## Limitations

- Discovery data and ranking are unchanged by the homepage styling.
- The dedicated `/discover` route uses the artwork-overlay design on mobile
  and desktop, retaining its description/media preview, up to 20 results,
  and backend exclude-followed filtering.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Wave Discover Cards](../waves/discovery/feature-discover-cards.md)
- [Waves Index](../waves/README.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../README.md)
