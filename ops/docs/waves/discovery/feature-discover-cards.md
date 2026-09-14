# Wave Discover Cards

## Overview

`/discover` renders a dedicated grid of active-wave cards.

- Cards share the same artwork-led design and wave information as home
  `Most active waves`, with artwork that fills rounded cards and fades into a
  dark background behind the text.
- The dedicated route expands the list to 20 cards.
- The route requests discovery data with `exclude_followed=true`.
- There is no `View all` footer because `/discover` is already the expanded
  surface.

Use this page to verify card loading, routing, and route-specific differences
from home discovery.

## Location in the Site

- Discovery route: `/discover`
- Non-DM card destination: `/waves/{waveId}`
- Direct-message card destination: `/messages/{waveId}`
- Home comparison surface: `/`

## Entry Points

- Open `/discover`.
- Open `Discovery` from web/app shell navigation.

## User Journey

1. Open `/discover`.
2. While loading, the route renders discovery skeleton cards.
3. When data resolves, up to 20 cards render in a responsive grid.
4. Select a wave entry.
5. The app opens `/waves/{waveId}` for non-DM waves or
   `/messages/{waveId}` for DM waves.

## Common Scenarios

- Open a discovery card to jump directly into wave chat context.
- Open a DM-targeting card to jump into `/messages/{waveId}`.
- Review the compact preview row when a wave description drop has usable text
  or media content.
- Read the available labelled metrics: `Score` is the visibility
  score, `Hot` is the hotness score, and `REP` is Wave REP. Visibility and hotness
  are scores out of 100. REP shows a signed, compact raw total when available;
  otherwise it shows the Wave REP score out of 100. Screen-reader labels
  distinguish the raw total from the score.
- Description text is limited to two lines. Cards keep space for the preview
  when it is absent, with drop count and relative activity time aligned below.
- Loading cards reuse the shared solid iron wave-card skeleton pattern while
  reserving the Discover card height.
- Artwork is subtly desaturated at rest and returns to full color on hover or
  keyboard focus. Touch cards retain full color.
- Sort and score-filter groups share a row when space allows and wrap when
  needed. On narrow screens, each group keeps its horizontal scrolling.
- Use `/discover` as the larger browse surface when home six-card discovery is
  not enough.

## Edge Cases

- Discovery cards share the same metadata, preview, and route mapping as home
  `Most active waves` cards.
- Preview content comes from the wave description drop rather than the latest
  chat message.
- Description previews retain their existing text and media handling; markdown
  markers can remain visible, and preview links are not separately clickable.
- If a wave description drop is empty, whitespace-only, or media-free, the card
  still opens the target wave route without rendering the compact preview row.
- Auth/profile requirements still apply after entering `/waves` or `/messages`
  content from a card.
- DM waves use canonical thread routes (`/messages/{waveId}`).

## Failure and Recovery

- If discovery cards never appear, refresh `/discover` to rerun the query.
- If a wave entry route fails, retry from `/waves` or `/messages` root routes.
- If the dedicated discovery page is empty, compare against home discovery on
  `/` to confirm whether the data source is empty or filtered.

## Limitations / Notes

- `/discover` intentionally omits the home subtitle and footer link.
- Home still caps its `Most active waves` section to six cards.

### Localization follow-up

- Affected surface: `DiscoverWaveExplorer` headings, sort/filter labels, empty
  state, and the `ExploreWavesSection` loading/result announcements on `/discover`.
- Current fallback: this existing copy remains English (`en-US`); card metric
  labels and number formatting use the existing default-locale helpers.
- User impact: visitors using other languages continue to receive English
  controls and status announcements. Wave-authored titles and descriptions stay
  in their original language.
- Follow-up owner: frontend wave-discovery maintainers. Move the remaining copy
  to message keys with complete count-aware status messages, then verify locale
  fallback and longer translated labels across supported locales.

## Related Pages

- [Wave Discovery Index](README.md)
- [Waves Index](../README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
