# Wave Drop TikTok Link Previews

## Overview

Wave drop markdown renders supported TikTok links as dedicated TikTok cards
instead of generic metadata cards. Cards are designed for profile and video
targets, with direct open-on-TikTok actions.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop containing a supported TikTok URL:
  - `https://www.tiktok.com/@{username}`
  - `https://www.tiktok.com/@{username}/video/{id}`
  - `https://www.tiktok.com/video/{id}`
  - Short-link families such as `https://vm.tiktok.com/...` and
    `https://vt.tiktok.com/...`
- Re-enable previews for a drop if previews were hidden.

## User Journey

1. Open a thread with a supported TikTok link.
2. The link renders a TikTok loading card.
3. The card resolves with thumbnail, author details, and caption content.
4. For long captions, use `Show more` / `Show less` to expand and collapse.
5. Use `Open on TikTok` to visit the canonical TikTok destination.

## Common Scenarios

- Video links show a video badge, thumbnail, and creator details.
- Profile links render profile-oriented card details with direct profile access.
- Repeated previews can resolve faster because TikTok responses are cached.

## Edge Cases

- Unsupported TikTok path shapes remain non-specialized links.
- If thumbnail loading fails, the card shows a visual placeholder but keeps the
  link action available.
- If previews are hidden for a drop, TikTok URLs stay plain until previews are
  shown again.

## Failure and Recovery

- Private or unavailable TikToks show an explicit unavailable message with
  `Open on TikTok`.
- If preview fetch fails, the card keeps a direct-open path so users can still
  access the original link.

## Limitations / Notes

- Dedicated TikTok cards activate only for supported TikTok URL families.
- Preview freshness depends on cache windows and upstream TikTok metadata.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
