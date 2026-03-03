# Wave Drop Quote Link Cards

Parent: [Wave Drop Actions Index](README.md)

## Overview

Same-origin wave serial links in drop markdown can render as inline quote cards
instead of plain links.

Supported source link formats:

- `/waves/{waveId}?serialNo={serialNo}`
- `/waves?wave={waveId}&serialNo={serialNo}` (legacy)

Quote rendering includes cycle protection and a max embed depth of `4`.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Drop markdown that contains supported same-origin wave serial links.

## Entry Points

- Open a drop with a supported serial link.
- Use either a relative link or an absolute same-origin link.
- If previews are hidden on your own drop, use `Show link previews` next to the
  first hidden link.

## User Journey

1. Open a thread with a supported same-origin serial link.
2. The app reads `waveId` and numeric `serialNo` from the link.
3. The quote card fetches the target drop by wave and serial number.
4. When found, the card shows author, time, wave name, and quoted text.
5. Select the card:
   - Same wave: jump to the target serial in place.
   - Different non-DM wave: open `/waves/{waveId}?serialNo={serialNo}`.
   - Different DM wave: open `/messages?wave={waveId}&serialNo={serialNo}`.

## Common Scenarios

- Path-style and legacy query-style wave links both render as quote cards.
- `serialNo` values with trailing slash (for example `serialNo=10/`) are normalized.
- Same-thread quote-card clicks jump in place.
- Cross-thread quote-card clicks navigate first, then jump by `serialNo`.

## Edge Cases

- `/messages?wave={waveId}&serialNo={serialNo}` links do not render as quote cards.
- Links with `drop` query are handled by drop-open behavior, not quote-card behavior.
- Extra query keys do not block quote rendering unless `drop` is present.
- Non-UUID `waveId` or non-numeric `serialNo` values stay plain links.
- If a quote would create a cycle in the current quote chain, rendering falls
  back to normal link behavior.
- Nested quote rendering is capped at `4` levels; deeper levels fall back to
  normal link behavior.
- If link previews are hidden for the drop, quote cards are suppressed until
  previews are re-enabled.

## Failure and Recovery

- Unsupported or guarded links (cycle/depth/invalid format) stay regular links.
- If quote rendering fails in the smart-link pipeline, fallback link rendering is used.
- If target fetch is slow or unavailable, the quote area can stay in placeholder
  state while the rest of the thread remains usable.
- If previews were hidden, re-enable with `Show link previews` (author-only control).

## Limitations / Notes

- Quote cards parse only same-origin `/waves` serial links:
  `/waves/{waveId}?serialNo={serialNo}` and `/waves?wave={waveId}&serialNo={serialNo}`.
- `/messages?wave={waveId}&serialNo={serialNo}` is a destination format used
  after card click for DM targets, not a quote-card source format.
- Quote previews render the target drop part used by the quote renderer (part `1` for serial links).

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Link Preview Toggle](../link-previews/feature-link-preview-toggle.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Drop Content Display](feature-content-display.md)
