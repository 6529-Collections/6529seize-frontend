# Media Routes and Minting Troubleshooting

## Overview

Use this page when media routes, minting controls, calendar lookups, rendering,
or outbound marketplace actions do not behave as expected.

## Location in the Site

- Memes mint and card routes: `/the-memes/mint`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`
- Memes calendar routes/API: `/meme-calendar`, `/api/meme-calendar/{id}`
- Gradient routes: `/6529-gradient`, `/6529-gradient/{id}`
- NFT detail routes that expose marketplace shortcuts
- Interactive submission preview surfaces that render sandboxed external
  content

## Entry Points

- Mint page shows loading/error/no-data states longer than expected.
- `Mint` action is unavailable or hidden.
- Card/deep-link route opens unexpected tab or not-found screen.
- Calendar route/API lookup returns invalid-id or out-of-range responses.
- Gradient list appears empty or stuck in loading state.
- Interactive HTML submission preview is missing or blocked.
- Marketplace links fail after opening new tabs.

## User Journey

1. Confirm the exact route and query values first.
2. Confirm wallet/session prerequisites for minting or ownership-only actions.
3. Confirm platform-specific constraints (for example iOS country gating).
4. Retry from a canonical route with minimal query state.
5. If needed, switch to related fallback routes (calendar home, card home, list
   home) and re-enter the same action.

## Common Scenarios

- Mint page stuck on fetch state:
  refresh `/the-memes/mint` to retry mint claim and instance loading.
- `Mint for fren` selected but mint action remains unavailable:
  choose a recipient profile and destination wallet first.
- Mint controls hidden on iOS:
  confirm country/platform handling and use the available handoff controls when
  shown.
- Card deep link opens unexpected tab:
  verify `focus` uses a supported tab key; unsupported values fall back to
  `Live`.
- `/the-memes/{id}` or `/the-memes/{id}/distribution` shows not-found:
  replace `{id}` with a valid positive integer and retry.
- `/api/meme-calendar/{id}` fails:
  invalid/non-positive IDs return `400`; valid but unresolved IDs return `422`.
- `/6529-gradient` query values behave unexpectedly:
  unsupported `sort`/`sort_dir` values are normalized to defaults.
- Interactive HTML preview does not render:
  confirm media URL is HTTPS and on allowed interactive hosts
  (`ipfs.io` or `arweave.net` forms).
- Marketplace icons are missing on iOS:
  shortcut links are hidden unless detected country is `US`.

## Edge Cases

- Upcoming numeric Memes card URLs can intentionally show next-mint fallback
  panels instead of full card content.
- Mint availability can change exactly at phase boundary timestamps.
- Marketplace links may differ by contract (for example Blur appears for
  Gradient contracts only).
- Interactive submission preview can be withheld when URL canonicalization or
  host/path validation fails.

## Failure and Recovery

- If route data appears stale, refresh and retry from canonical route roots:
  `/`, `/the-memes/mint`, `/the-memes/{id}`, `/meme-calendar`,
  `/6529-gradient`.
- If wallet actions fail, reconnect wallet/session and retry with the same
  destination wallet selection.
- If calendar export popup is blocked, allow popups or use ICS download.
- If an external marketplace page fails, keep current app state and retry in a
  new tab later.
- If interactive submission preview is absent, open the canonical media URL
  separately and confirm it meets supported host/path constraints before
  retrying in-app.

## Limitations / Notes

- Some issues are external-provider problems (marketplace uptime, wallet popup
  policies, CDN/media host responses).
- Route-level not-found handling and feature-level action errors can happen
  independently on the same page family.
- Mint, schedule, and ownership displays are live-data driven and can be
  briefly inconsistent during updates.

## Related Pages

- [Media Index](README.md)
- [Media Discovery and Actions Flow](flow-media-discovery-and-actions.md)
- [The Memes Mint Flow](memes/feature-mint-flow.md)
- [Memes Minting Calendar](memes/feature-minting-calendar.md)
- [The Memes Card Tabs and Focus Links](memes/feature-card-tabs-and-focus-links.md)
- [NFT Marketplace Shortcut Links](nft/feature-marketplace-links.md)
- [Interactive HTML Media Rendering](rendering/feature-interactive-html-rendering.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
