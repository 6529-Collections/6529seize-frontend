# Wave Drop Social Platform Previews

## Overview

Wave drop markdown renders supported social-platform links as provider-specific cards
instead of generic metadata cards.
This page covers TikTok, Farcaster, and Tenor GIF behavior.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop-card contexts using shared markdown preview rendering

## Entry Points

- Open/publish drops containing supported social links:
  - TikTok (`www.tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`)
  - Farcaster/Warpcast (`warpcast.com`, `farcaster.xyz`)
  - Tenor GIF (`media.tenor.com` URL paths ending in `.gif`)
- Re-enable previews when previews are hidden for a drop.

## User Journey

1. Open a thread with a supported social-platform URL.
2. Renderer maps URL to provider-specific card type.
3. Card shows loading state, then resolved provider metadata.
4. Use provider open actions (`Open on TikTok`, `Open on Warpcast`) or continue
   reading inline.

## Common Scenarios

- TikTok profile and video links render dedicated TikTok cards.
- TikTok long captions can use `Show more` / `Show less`.
- Farcaster links render cast/profile/channel card layouts based on URL path.
- Farcaster unavailable targets show explicit unavailable state with open-on-Warpcast.
- Tenor `media.tenor.com/*.gif` URLs render inline GIF previews.
- Tenor GIFs in chat/message contexts use fixed-height presentation for timeline
  stability; home/leaderboard variants keep shared card flow.
- If previews are hidden for a drop, supported social links stay plain until
  previews are shown again.

## Edge Cases

- Unsupported provider path shapes fall back to non-specialized link handling.
- Sparse upstream metadata can still produce partial cards.
- Invalid URLs or unsupported hosts remain plain links.

## Failure and Recovery

- While provider data loads, users see provider loading/skeleton states.
- If provider fetch fails or target is unavailable, renderer keeps direct-open
  fallback paths where available.
- If preview visibility toggling fails, drop returns to prior state and users can
  retry from same thread context.

## Limitations / Notes

- Dedicated social cards activate only for supported host/path patterns.
- Card detail quality depends on upstream provider metadata availability.

## Related Pages

- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
