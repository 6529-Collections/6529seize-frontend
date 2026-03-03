# Wave Link Previews

## Overview

Use this area when a drop contains URLs and you need to know:

- when links render as cards vs plain links
- which provider card is used for a URL
- when `Hide link previews` and `Show link previews` are available

This area covers external/provider previews and preview visibility controls.
Internal Seize embed cards (wave/group/drop/quote) are documented in
[Wave Drop Quote Link Cards](../drop-actions/feature-quote-link-cards.md).

## Route and Surface Coverage

- wave threads at `/waves/{waveId}`
- direct-message threads at `/messages?wave={waveId}`
- boosted-card previews on `/`
- home-style preview variants inside wave leaderboard card content

Preview toggle actions are available in wave and direct-message thread drops.
Home-style variants do not show link-preview toggle actions.

## Features

- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md): author-only
  hide/show controls for link previews on a drop.
- [Wave Drop External Link Previews](feature-external-link-previews.md):
  generic metadata cards for supported HTTP(S) links.
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md):
  YouTube-specific preview cards and inline playback.
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md):
  tweet-specific cards, compact/expand behavior, and fallback states.
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md):
  TikTok, Farcaster/Warpcast, and Tenor GIF previews.
- [Wave Drop Knowledge and Workspace Previews](feature-knowledge-and-workspace-previews.md):
  Google Workspace and Wikimedia previews.
- [Wave Drop Web3 Preview Cards](feature-web3-preview-cards.md): ENS,
  marketplace, Art Blocks, Compound, and `pepe.wtf` previews.

## Picking the Right Page

- Need to hide or restore previews on your own drop: open
  `Wave Drop Link Preview Toggle`.
- URL matches a known provider family: open the matching provider page above.
- URL does not match a known provider: open `Wave Drop External Link Previews`.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): canonical end-to-end
  wave navigation and interaction flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Media Index](../../media/README.md)
