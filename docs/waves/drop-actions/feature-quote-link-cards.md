# Wave Drop Quote Link Cards

Parent: [Wave Drop Actions Index](README.md)

## Overview

Same-origin wave serial links in drop markdown can render as inline quote cards.
This runs only when link previews are visible for that drop.

Quote rendering is cycle-guarded and depth-limited to `4` nested quote levels.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Drop markdown that contains supported same-origin wave serial links.

## Supported Source Links

- `/waves/{waveId}?serialNo={serialNo}`
- `/waves?wave={waveId}&serialNo={serialNo}` (legacy)

Rules:

- `waveId` must be a valid UUID.
- `serialNo` must be numeric. Trailing slash values are normalized (for example
  `serialNo=10/` becomes `10`).
- Links with `drop=...` do not use quote-card rendering.
- `/messages?wave={waveId}&serialNo={serialNo}` is a navigation destination for
  DM targets, not a quote-card source format.

## User Journey

1. Open a thread with a supported same-origin serial link.
2. The app parses `waveId` and `serialNo`, then fetches that target drop.
3. When found, the card shows author, time, wave name, and quoted text.
4. Select the card:
   - Same wave: jump to the target serial in place.
   - Different non-DM wave: open `/waves/{waveId}?serialNo={serialNo}`.
   - Different DM wave: open `/messages?wave={waveId}&serialNo={serialNo}`.

## Common Scenarios

- Path-style and legacy query-style wave serial links both render as quote cards.
- Same-thread quote-card clicks jump in place.
- Cross-thread quote-card clicks navigate first, then jump by `serialNo`.
- While a quote target is loading, the quote card area shows placeholder content.
- Extra query keys do not block quote rendering unless `drop` is present.
- If previews are hidden for a drop, quote cards stay suppressed until the author
  restores previews from the desktop `More` menu.

## Edge Cases

- `/messages?wave={waveId}&serialNo={serialNo}` links do not render as quote cards.
- Links with `drop` query are handled by drop-open link behavior, not quote-card behavior.
- Non-UUID `waveId` or non-numeric `serialNo` values stay plain links.
- Missing `serialNo` values stay plain links.
- If a quote would create a cycle in the current quote chain, rendering falls
  back to normal link behavior.
- Nested quote rendering is capped at `4` levels; deeper levels fall back to
  normal link behavior.
- `/waves/{waveId}` links without `serialNo` do not use quote-card rendering.
- When previews are hidden, quote-card sources stay plain links until the
  author restores previews from the desktop `More` menu. Other viewers only
  see the plain links.

## Failure and Recovery

- Unsupported or guarded links (cycle/depth/invalid format) stay regular links.
- If quote rendering fails in the smart-link pipeline, fallback smart-link or
  regular-link rendering is used.
- If target fetch is slow or unavailable, the quote area can stay in placeholder
  state while the rest of the thread remains usable.
- If the target drop cannot be resolved (for example inaccessible or missing), the
  quote area can remain in placeholder state without a separate empty-state message.
- If previews were hidden, restore them from the desktop `More` menu before
  retrying quote-card rendering.

## Limitations / Notes

- Quote cards parse only same-origin `/waves` serial links in markdown:
  `/waves/{waveId}?serialNo={serialNo}` and `/waves?wave={waveId}&serialNo={serialNo}`.
- `/messages?wave={waveId}&serialNo={serialNo}` is a destination format used
  after card click for DM targets, not a quote-card source format.
- Quote previews render the target drop part used by the quote renderer (part `1` for serial links).

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Link Preview Toggle](../link-previews/feature-link-preview-toggle.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Content Display](feature-content-display.md)
