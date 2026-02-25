# Wave Drop Farcaster Link Previews

## Overview

Wave drop markdown renders supported Farcaster links as dedicated Farcaster
cards instead of generic metadata previews. Cards are tailored for cast,
profile, or channel targets.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop containing a supported Farcaster URL, including:
  - `https://warpcast.com/{username}`
  - `https://warpcast.com/{username}/{castHash}`
  - `https://warpcast.com/~/channel/{channel}`
  - `https://warpcast.com/~/channel/{channel}/{castHash}`
  - `https://farcaster.xyz/u/{username}` (and equivalent cast paths)
- Re-enable previews when link previews are hidden for a drop.

## User Journey

1. Open a thread with a supported Farcaster URL.
2. The link renders a Farcaster loading card.
3. The card resolves into cast, profile, or channel layout based on the URL.
4. Use `Open on Warpcast` actions to jump to the canonical Farcaster target.

## Common Scenarios

- Cast links show author identity, cast text, image embeds (if present), and
  reaction counts.
- Profile links show avatar, display name, handle, and bio when available.
- Channel links show channel identity, description, and latest-cast summary.

## Edge Cases

- Unsupported Farcaster path shapes fall back to non-Farcaster link handling.
- If previews are hidden for a drop, Farcaster links stay plain until previews
  are shown again.
- Sparse upstream data can still produce partial cards instead of fully failing.

## Failure and Recovery

- While preview data loads, users see a skeleton card.
- If a Farcaster target is unavailable, users see an explicit unavailable state
  with an open-on-Warpcast action.
- If preview resolution fails entirely, the renderer falls back to a regular
  clickable link.

## Limitations / Notes

- Specialized cards activate only for supported Warpcast/Farcaster URL
  patterns.
- Card content depends on public Farcaster data availability.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
