# Wave Description Preview Popover

## Overview

When an active non-DM wave has a description drop, wave headers show a compact
subtitle preview under the wave title. Selecting the title/preview opens a
popover with the full description drop content.

Users can:

- See a one-line preview derived from the wave description drop.
- Open full description content directly from header title area.
- Close the popover with outside click/tap, `Escape`, or the same trigger.

## Location in the Site

- App header on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Web thread headers on the same routes:
  - desktop wave tabs header
  - mobile tabs header subtitle row

## Availability Rules

- Visible only for active non-DM waves.
- Hidden when `description_drop.id` is missing.
- Hidden when the first description part resolves to empty preview text.
- On mobile tabs headers, the wave-name button still opens search; preview uses
  a separate trigger below it.

## Preview Text Rules

- Source is the first description part only.
- Markdown links become `label (url)`.
- Markdown images become their raw URL in preview text.
- Common markdown formatting is stripped to plain text and whitespace is
  collapsed.

## Entry Points

1. Open a non-DM wave thread route.
2. Select the wave title/preview trigger (`Show wave description`) in:
   - app header center title area, or
   - wave tabs header title/subtitle area.

## User Journey

1. Open `/waves/{waveId}` or `/messages?wave={waveId}` for a non-DM wave.
2. Read subtitle preview below the wave title (when available).
3. Select the title/preview trigger to open popover content.
4. Review the full pinned description drop in the popover.
5. Close with trigger reselect, outside click/tap, or `Escape`.
6. Continue thread actions without route or tab changes.

## Edge Cases

- If description markdown is malformed, preview keeps remaining source text
  instead of failing.
- If preview text is long, header subtitle stays single-line/truncated.
- Popover auto-chooses above/below placement by available viewport space and
  remains scrollable when content exceeds available height.
- Direct-message waves do not show this preview trigger.

## Failure and Recovery

- If no preview appears, verify the wave has a valid description drop and
  non-empty first-part content.
- If only a short snippet is visible, open the popover for full content.
- If popover placement is tight on small viewports, resize or scroll; content
  remains accessible within the popover container.

## Limitations / Notes

- This surface is read-only for description content.
- Preview text is normalized plain text, not rendered markdown.
- Only first-part description content contributes to preview.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Wave Link Share and Copy](feature-wave-link-share-copy.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
