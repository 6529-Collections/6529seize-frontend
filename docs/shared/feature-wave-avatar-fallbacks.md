# Wave Avatar Fallbacks

## Overview

Shared wave-avatar surfaces prefer an explicit wave picture. When no picture is
set, the app falls back to contributor collages and finally to neutral gradient
art.

These fallback rules are reused so direct-message and wave avatars stay
consistent across headers, rows, chips, and hover cards.

## Location in the Site

- Active thread surfaces that show the shared wave avatar, including:
  - app header active-thread avatar
  - right-sidebar `About` header on `/waves/{waveId}` and
    `/messages?wave={waveId}`
- Wave and direct-message rows in `/waves*` and `/messages*` shells.
- Native app recent-thread/pinned-thread cards that reuse the same avatar.
- Wave hover cards on `#wave` mention links.

## Entry Points

1. Open any surface that renders a round wave avatar.
2. If the wave has a saved picture, that picture renders.
3. If not, the surface falls back to contributor images or gradient art.

## User Journey

1. The surface requests the shared wave avatar.
2. If `wave.picture` exists, users see that image cropped to a circle.
3. Otherwise, contributor profile pictures with valid image URLs are collected
   in their existing order.
4. If the signed-in profile or active proxy creator matches a contributor
   identity, that contributor is removed from the collage.
5. Up to 6 remaining contributor images are clipped into the round collage.
6. If no contributor image remains, the avatar falls back to the neutral
   gradient.

## Common Scenarios

- Regular waves without custom art show a multi-person contributor collage.
- Direct-message waves without custom art omit the signed-in participant's own
  matched PFP so the other participant(s) stay visible.
- Proxy sessions use the proxy creator identity for the same exclusion rule.
- Headers, list rows, recent-thread chips, and wave hover cards stay visually
  aligned because they all reuse these rules.

## Edge Cases

- Contributors without a PFP URL are ignored.
- When more than 6 contributors remain, only the first 6 are shown.
- Identity matching is case-insensitive and can resolve through handle,
  normalized handle, wallet, primary address, query value, or `id-0x...`-style
  IDs.
- If the only usable contributor image belongs to the signed-in identity, the
  avatar falls back to the neutral gradient instead of repeating that PFP.

## Failure and Recovery

- If no saved wave picture exists, the collage/gradient fallback still preserves
  the avatar slot.
- If contributor identity metadata is missing, unmatched contributors remain
  eligible for the collage.
- If no contributor image is usable, the neutral gradient keeps the layout
  stable instead of leaving a broken avatar.

## Limitations / Notes

- This page owns shared wave-avatar rendering only.
- Header edit permissions are documented in the Waves Header docs.
- Hover timing and tooltip behavior are documented separately in Shared docs.

## Related Pages

- [Shared Index](README.md)
- [Hover Cards and Tooltip Positioning](feature-hover-cards-and-tooltips.md)
- [Wave Header Controls](../waves/header/feature-wave-header-controls.md)
- [Update Wave Picture](../waves/header/feature-wave-picture-edit.md)
- [Brain Wave Row Metadata and Last Drop Indicator](../waves/sidebars/feature-brain-list-last-drop-indicator.md)
