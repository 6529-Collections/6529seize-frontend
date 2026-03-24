# Media Routes and Minting Troubleshooting

## Overview

Use this page when media routes, minting controls, calendar lookups,
interactive previews, or marketplace shortcuts fail.

## Location in the Site

- The Memes: `/the-memes`, `/the-memes/mint`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`
- Meme Lab: `/meme-lab`, `/meme-lab/collection/{collection}`, `/meme-lab/{id}`,
  `/meme-lab/{id}/distribution`
- ReMemes: `/rememes`, `/rememes/{contract}/{id}`, `/rememes/add`
- Calendar: `/meme-calendar`, `/api/meme-calendar/{id}`
- 6529 Gradient: `/6529-gradient`, `/6529-gradient/{id}`
- Interactive HTML preview in Memes submission
- NFT detail pages with marketplace shortcuts

## Entry Points

- `/the-memes/mint` stays in loading, error, or no-data state.
- A detail route opens the wrong tab, fallback panel, or mostly blank layout.
- Meme Lab, ReMemes, or Gradient routes show empty results.
- ReMemes add flow cannot validate or submit.
- Calendar lookup fails for a mint ID.
- Interactive preview does not render.
- Marketplace shortcuts are missing or do not open.

## User Journey

1. Start from a canonical route root (`/the-memes`, `/meme-lab`, `/rememes`,
   `/6529-gradient`, `/meme-calendar`).
2. Recheck route parameters and query values (`id`, `contract`, `collection`,
   `focus`, `sort`, `sort_dir`, `meme_id`).
3. Recheck wallet and profile state for minting or owner-only actions.
4. Recheck iOS + country gating before troubleshooting missing actions.
5. Retry the action from the parent list route with minimal query state.

## Common Scenarios

- `/the-memes/mint` shows `Retrieving Mint information`, `Error fetching mint information`,
  or `No mint information found`:
  refresh `/the-memes/mint` and retry.
- Mint action is missing after wallet connect:
  controls are hidden when claim status is ended or finalized.
- `Mint for fren` is selected but mint action is missing:
  choose a recipient wallet first.
- Mint controls are missing on iOS:
  only iOS + `US` shows `Mint on 6529.io`; non-`US` iOS can hide controls.
- `/the-memes/{id}` opens unexpected content:
  unsupported `focus` falls back to `live`; non-integer IDs show not-found;
  unresolved numeric IDs show the next-mint fallback panel.
- `/the-memes/{id}/distribution` looks wrong:
  invalid or non-positive IDs show `DISTRIBUTION` not-found; valid IDs without
  a published plan show upcoming fallback content.
- `/meme-lab/collection/{collection}` is empty:
  confirm the slug and reopen from `/meme-lab` collection links.
- `/meme-lab/{id}`, `/rememes/{contract}/{id}`, or `/6529-gradient/{id}` looks
  blank:
  unresolved records can render only partial layout without a dedicated
  not-found panel.
- `/rememes` looks empty:
  set `Meme Reference` to `All`, `Token Type` to `All`, `Sort` to `Random`, then
  refresh results.
- `/rememes/add` submit stays disabled:
  `Validate` must pass, at least one meme reference is required, wallet must be
  connected, and all checklist checks must pass.
- `/api/meme-calendar/{id}` fails:
  invalid, non-positive, or non-safe-integer IDs return `400`; unresolved IDs
  return `422`.
- `/6529-gradient` query behavior is unexpected:
  unsupported `sort` or `sort_dir` normalizes to `sort=id&sort_dir=asc`.
- Interactive preview is missing in Memes submission:
  only HTTPS HTML documents from approved hosts are allowed (`ipfs.io`,
  `www.ipfs.io`, `arweave.net`, `www.arweave.net`, valid
  `*.arweave.net` tx subdomains), with root CID/tx IDs only.
- Marketplace icons are missing:
  icons are hidden on iOS unless detected country is `US`; Blur only appears
  for Gradient contracts.

## Edge Cases

- Numeric but unresolved Memes card IDs can intentionally render next-mint
  fallback content instead of full card content.
- Mint button availability can change at phase boundary timestamps.
- Allowlist phases can show `No spots in current phase for this address` while
  the drop is still active.
- ReMemes keeps only `meme_id` in the URL; token type and sort reset on reload.
- Some detail routes render partial layout without an explicit route-level
  not-found panel.
- Interactive preview validation rejects query strings, fragments, unsupported
  ports, and redirects to unapproved hosts.

## Failure and Recovery

- Retry from canonical roots first:
  `/the-memes/mint`, `/the-memes`, `/meme-lab`, `/rememes`, `/meme-calendar`,
  `/6529-gradient`.
- Reopen deep links from a parent list card when detail routes look blank.
- Reconnect wallet/profile state before retrying mint or transfer actions.
- For ReMemes add flow, fix validation/checklist errors, run `Validate` again,
  then sign again.
- If calendar invite links fail, retry from `/meme-calendar` and use ICS
  download fallback.
- If marketplace pages fail, keep app state and retry in a new tab.
- If interactive preview fails, recheck host, root CID/tx ID, and HTML
  content-type requirements.

## Limitations / Notes

- Some failures come from external providers (wallets, gateways, marketplaces,
  media hosts).
- Several media detail routes do not render explicit in-app not-found banners.
- Route-level fallback rendering and action-level errors can happen separately.
- Mint, schedule, and ownership values are live-data driven and can be briefly
  inconsistent during updates.

## Related Pages

- [Media Index](README.md)
- [Media Discovery and Actions Flow](flow-media-discovery-and-actions.md)
- [The Memes Mint Flow](memes/feature-mint-flow.md)
- [Memes Minting Calendar](memes/feature-minting-calendar.md)
- [The Memes Card Tabs and Focus Links](memes/feature-card-tabs-and-focus-links.md)
- [Meme Lab List and Collection Browsing](collections/feature-meme-lab-list-and-collection-browsing.md)
- [Meme Lab Card Route Tabs and Navigation](collections/feature-meme-lab-card-route-tabs-and-navigation.md)
- [ReMemes Browse and Detail](collections/feature-rememes-browse-and-detail.md)
- [ReMemes Add Submission](collections/feature-rememes-add-submission.md)
- [6529 Gradient List Sorting and Loading](rendering/feature-6529-gradient-list-sorting-and-loading.md)
- [NFT Marketplace Shortcut Links](nft/feature-marketplace-links.md)
- [Interactive HTML Media Rendering](rendering/feature-interactive-html-rendering.md)
- [Memes Submission Workflows](../waves/memes/feature-memes-submission.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
