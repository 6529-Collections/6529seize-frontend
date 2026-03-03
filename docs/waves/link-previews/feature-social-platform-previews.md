# Wave Drop Social Platform Previews

Parent: [Wave Link Previews Index](README.md)

## Overview

Wave markdown renders supported social links with provider-specific previews:
TikTok cards, Farcaster/Warpcast cards, and Tenor GIF embeds.

If a social URL does not match supported host/path patterns, rendering falls
back to the generic external preview flow, then to a plain link if needed.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Home-style drop cards that reuse wave markdown preview rendering:
  - Boosted cards on `/`
  - Wave leaderboard card content

## Supported URL Patterns

### TikTok

- `www.tiktok.com`, `m.tiktok.com`, `tiktok.com`
- `vm.tiktok.com/*`, `vt.tiktok.com/*` short links
- `/@{username}`
- `/@{username}/video/{numericId}`
- `/video/{numericId}`

### Farcaster/Warpcast

- `warpcast.com/{username}`
- `warpcast.com/{username}/{castHash}`
- `warpcast.com/~/channel/{channel}`
- `warpcast.com/~/channel/{channel}/{castHash}`
- `farcaster.xyz/{username}` and `farcaster.xyz/{username}/{castHash}`
- `farcaster.xyz/u/{username}` and `farcaster.xyz/u/{username}/{castHash}`

### Tenor GIF

- `media.tenor.com/.../*.gif`

## Entry Points

- Open or publish a drop with one or more supported social URLs.
- Open existing wave/message drops that already contain supported social URLs.
- If previews are hidden, use `Show link previews` on the drop.

## User Journey

1. Open a wave/message thread or home-style drop card with a supported social
   URL.
2. The renderer maps the URL to TikTok, Farcaster, or Tenor handling.
3. TikTok/Farcaster links show loading cards, then resolve to provider layouts.
4. Tenor GIF links render inline GIF previews.
5. Users can continue reading inline or open provider destinations from card
   actions.

## Common Scenarios

- TikTok cards show provider label, creator identity, caption, thumbnail, and
  `Open on TikTok`.
- Long TikTok captions can expand/collapse with `Show more` and `Show less`.
- TikTok short links are resolved to canonical TikTok URLs before metadata
  rendering.
- Farcaster links render cast, profile, or channel cards based on URL shape.
- Farcaster cast cards can show author, relative time, channel tag, text, image
  embeds, and reaction counts.
- Unavailable Farcaster targets show `Unavailable on Farcaster` with an
  `Open on Warpcast` action.
- Tenor `media.tenor.com/*.gif` links render inline GIF previews.
- Tenor GIF sizing is surface-dependent:
  - Wave/message markdown rendering uses a fixed-height GIF frame for stable
    row height.
  - Home-style markdown variants (including boosted cards and wave leaderboard
    card content) use non-fixed GIF sizing.
- If previews are hidden for a drop, supported social links stay plain until
  previews are shown again.

## Edge Cases

- TikTok links with unsupported paths (for example `.../@user/live`) do not use
  a TikTok card.
- TikTok links without a numeric video ID do not use a TikTok card.
- Farcaster blocked profile subpaths (`likes`, `recasters`, `followers`,
  `casts`, `reactions`) do not use Farcaster cards.
- Unsupported host/path shapes fall back to generic external preview handling,
  then plain links if generic preview data is unavailable.
- Sparse upstream metadata can still render partial card content.

## Failure and Recovery

- TikTok and Farcaster cards show loading placeholders while provider data
  resolves.
- TikTok unavailable/private or fetch-failure states show an unavailable card
  with `Open on TikTok`.
- Farcaster unavailable resources show `Unavailable on Farcaster` plus
  `Open on Warpcast`.
- Farcaster rendering/fetch failures fall back to generic external preview or a
  regular link.
- If preview visibility toggling fails, drop returns to prior state and users can
  retry from same thread context.

## Limitations / Notes

- Dedicated social cards activate only for supported host/path patterns.
- Farcaster cards only cover supported profile/cast/channel URL families.
- Card detail quality depends on upstream provider metadata availability.
- This page covers inline drop markdown rendering only.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Knowledge and Workspace Previews](feature-knowledge-and-workspace-previews.md)
- [Wave Drop Web3 Preview Cards](feature-web3-preview-cards.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
