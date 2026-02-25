# Wave Drop Twitter/X Link Previews

## Overview

Wave post cards and homepage boosted cards render supported Twitter/X status links as
inline tweet previews instead of plain URL text.

In standard chat and message surfaces, tweet previews are constrained to the full
available width with a desktop max-width cap so previews stay narrower than wide
screens and avoid dominating list rows.

The preview component measures tweet height so most short tweets stay fully expanded,
while long tweets can be shown compactly with a `Show full tweet` action. This keeps
message and card layouts stable in dense lists.

When tweet content cannot be loaded, the card falls back to a clearly labeled
external-link state.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer
- Boosted cards on `/` (twitter-linked boosted drops)

## Entry Points

- Open a drop that contains a supported Twitter/X status URL.
- Open a shared drop link that includes a supported Twitter/X status URL in markdown
  content.
- Open a boosted tweet card on `/`.

## User Journey

1. Open a wave thread, DM thread, or homepage boosted card containing a supported
   Twitter/X status URL.
2. The URL is normalized into a tweet preview URL and rendered inline with a loading
   state.
3. When tweet data is available, the card renders tweet content inline.
4. The system checks tweet height:
   - Short tweets render fully.
   - Longer tweets render in compact mode and show `Show full tweet`.
5. Tap/click `Show full tweet` to reveal the full content, replies, actions, and
   media block where available.

## Common Scenarios

- Supported links include `twitter.com` and `x.com` hosts (including subdomains such
  as `mobile.twitter.com`) when the URL path contains `status/{id}` or
  `statuses/{id}` with a numeric tweet ID.
- Tracking query parameters after the tweet ID (for example `?s=20`) do not prevent
  the tweet preview card from rendering.
- In wave contexts that show link previews, users still get adjacent copy/open controls
  alongside the tweet preview card.
- Multiple supported Twitter/X links in one drop each render their own preview card.
- If link previews are hidden for a drop, Twitter/X URLs remain plain links until
  previews are enabled.
- During message loading from jump-to-serial or older-page scroll operations, newly
  inserted drops can keep long tweets in compact mode until users choose to expand.
- In homepage and leaderboard card contexts, tweet previews keep the shared width
  rule and still allow the `Show full tweet` control.

## Edge Cases

- Twitter/X links without a valid numeric tweet ID do not render as tweet cards and
  remain regular links.
- Legacy hash-based status URL formats such as
  `https://twitter.com/#!/user/status/{id}` are accepted, including variants that
  append query parameters.
- If tweet content is short, the preview renders fully with no expand control.
- If tweet metadata loads but rendering fails, users see the fallback card and can open
  the original URL.

## Failure and Recovery

- While tweet data is loading, users see a loading placeholder in the card.
- If tweet data is unavailable (for example removed, restricted, or not returned),
  users see a fallback card labeled `Tweet unavailable` and can continue with
  `Open on X`.
- If tweet preview rendering throws an error, users see the same fallback card and can
  continue with the original link.
- If a compacted long tweet is difficult to scan, users can expand it directly without
  leaving the thread.
- If preview visibility toggling fails, the drop returns to its prior state and users can
  retry from the same thread context.

## Limitations / Notes

- Auto-compaction is driven by measured tweet height and the surrounding viewport flow;
  external content or network state still determines whether full metadata is available.
- This page covers inline tweet rendering in drop and boosted-card contexts only, not
  standalone tweet tooling outside the current UI surfaces.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Tenor GIF Previews](feature-tenor-gif-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
