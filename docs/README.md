# Documentation

User-facing docs for routes, actions, loading states, empty states, failure
states, and recovery paths.

## Start Here

1. Find your route family in **Route Coverage**.
2. Open the matching area in **Area Index**.
3. Read in this order: `feature-*` pages, then `flow-*`, then
   `troubleshooting-*`.

## I am trying to...

- Understand what the landing route shows: [Home](home/README.md)
- Browse waves and open thread views:
  [Waves](waves/README.md), [Waves Discovery](waves/discovery/README.md),
  [Waves Chat](waves/chat/README.md)
- Create waves or direct messages: [Waves Create](waves/create/README.md)
- Post, edit, and submit drops: [Waves Composer](waves/composer/README.md)
- Vote, react, curate, and copy/share links:
  [Waves Drop Actions](waves/drop-actions/README.md)
- Open profile routes and tabs:
  [Profiles](profiles/README.md),
  [Profile Troubleshooting](profiles/troubleshooting/README.md)
- Check network metrics, definitions, and TDH/xTDH rules:
  [Network](network/README.md)
- Manage groups and group-scoped views:
  [Groups](groups/README.md),
  [Network Group Scope Flow](network/flow-network-group-scope.md)
- Run delegation actions and wallet checks: [Delegation](delegation/README.md)
- Run EMMA plan and distribution operations: [EMMA](emma/README.md)
- Download Open Data datasets: [Open Data](open-data/README.md)
- Use app shell navigation and mobile handoff: [Navigation](navigation/README.md)
- Use API and utility routes under `/tools/*`: [API Tool](api-tool/README.md)
- Debug shared cross-route behavior: [Shared](shared/README.md)

## Location in the Site

- Root docs route-ownership anchors (fallback for API Tool pages that do not
  define `Location in the Site`):
  - `/tools/api`
  - `/tools/block-finder`
  - `/tools/subscriptions-report`
  - `/tools/app-wallets`
  - `/tools/app-wallets/import-wallet`
  - `/tools/app-wallets/{app-wallet-address}`

## Route Coverage

### In Scope

- Core app routes:
  `/`, `/discover`, `/waves`, `/waves/{waveId}`, `/waves/create`,
  `/messages`, `/messages/create`, `/messages?wave={waveId}`
- Profile routes:
  `/{user}`, `/{user}/*`, `/about/primary-address`
- Media routes:
  `/the-memes*`, `/6529-gradient*`, `/meme-lab*`, `/rememes*`,
  `/meme-calendar`
- Ops and data routes:
  `/notifications`, `/network`, `/network/*`, `/network/groups`, `/xtdh`,
  `/delegation/*`, `/nextgen/*`, `/nft-activity`, `/tools/api`,
  `/tools/block-finder`, `/tools/subscriptions-report`,
  `/tools/app-wallets*`, `/open-data`, `/open-data/*`, `/emma/*`,
  `/open-mobile`
- Shared cross-route behavior:
  [Navigation](navigation/README.md) and [Shared](shared/README.md)

### Out of Scope

- Content/editorial/legal routes:
  `/about/*` (except `/about/primary-address`), `/museum/*`, `/blog/*`,
  `/news/*`, `/city/*`, `/om/*`, `/education/*`, `/capital/*`, `/author/*`,
  `/category/*`, `/buidl`, `/casabatllo`
- Standalone utility routes:
  `/access`, `/restricted`, `/dispute-resolution`,
  `/accept-connection-sharing`, `/email-signatures`,
  `/consolidation-mapping-tool`, `/delegation-mapping-tool`,
  `/meme-accounting`, `/meme-gas`
- Legacy and diagnostics routes:
  `/feed` (redirects to `/index.xml`), `/slide-page/*`, `/element_category/*`,
  `/gm-or-die-small-mp4`, `/cdn-cgi/l/email-protection`, `/error`,
  `/sentry-example-page`

## Area Index

- [Home](home/README.md): `/` landing behavior
- [Waves](waves/README.md): `/discover`, `/waves`, `/waves/{waveId}`,
  `/waves/create`, `/messages`, `/messages/create`,
  `/messages?wave={waveId}`
- [Profiles](profiles/README.md): `/{user}` routes and `/about/primary-address`
- [Media](media/README.md): `/the-memes`, `/6529-gradient`, `/meme-lab`,
  `/rememes`, `/meme-calendar`
- [Notifications](notifications/README.md): `/notifications`
- [Network](network/README.md): `/network`, `/network/*`, `/xtdh`
- [Groups](groups/README.md): `/network/groups`
- [Delegation](delegation/README.md): `/delegation/*`
- [NextGen](nextgen/README.md): `/nextgen/*`
- [Realtime](realtime/README.md): `/nft-activity`
- [API Tool](api-tool/README.md): `/tools/api`, `/tools/block-finder`,
  `/tools/subscriptions-report`, `/tools/app-wallets*`
- [EMMA](emma/README.md): `/emma/*`
- [Open Data](open-data/README.md): `/open-data` and `/open-data/*`
- [Navigation](navigation/README.md): shell controls, cross-route navigation,
  and `/open-mobile`
- [Shared](shared/README.md): behavior reused by multiple areas

## Subarea Indexes

- Waves: [Discovery](waves/discovery/README.md),
  [Create](waves/create/README.md), [Chat](waves/chat/README.md),
  [Composer](waves/composer/README.md),
  [Drop Actions](waves/drop-actions/README.md),
  [Header](waves/header/README.md), [Sidebars](waves/sidebars/README.md),
  [Link Previews](waves/link-previews/README.md),
  [Leaderboard](waves/leaderboard/README.md),
  [Memes](waves/memes/README.md)
- Profiles: [Navigation](profiles/navigation/README.md),
  [Tabs](profiles/tabs/README.md), [About](profiles/about/README.md),
  [Troubleshooting](profiles/troubleshooting/README.md)
- Media: [Memes](media/memes/README.md),
  [Collections](media/collections/README.md), [NFT](media/nft/README.md),
  [Rendering](media/rendering/README.md)

## Troubleshooting Entry Point

- Start here when a route is blocked, data is missing, or an action fails.
- [Home Route and Section Visibility](home/troubleshooting-home-route-and-section-visibility.md)
- [Navigation and Shell Controls](navigation/troubleshooting-navigation-and-shell-controls.md)
- [Wave Navigation and Posting](waves/troubleshooting-wave-navigation-and-posting.md)
- [Profile Routes and Tabs](profiles/troubleshooting/troubleshooting-routes-and-tabs.md)
- [Notifications Feed](notifications/troubleshooting-notifications-feed.md)
- [Network Routes and Health](network/troubleshooting-network-routes-and-health.md)
- [Groups List and Create Actions](groups/troubleshooting-groups-list-and-create-actions.md)
- [Delegation Routes and Actions](delegation/troubleshooting-delegation-routes-and-actions.md)
- [EMMA Access and Plan Operations](emma/troubleshooting-emma-access-and-plan-operations.md)
- [Media Routes and Minting](media/troubleshooting-media-routes-and-minting.md)
- [NextGen Routes, Mint, and Admin](nextgen/troubleshooting-nextgen-routes-mint-and-admin.md)
- [NextGen Slideshow and Token Media](nextgen/troubleshooting-nextgen-slideshow-and-token-media.md)
- [Open Data Routes and Download States](open-data/troubleshooting-open-data-routes-and-downloads.md)
- [Realtime Connectivity](realtime/troubleshooting-realtime-connectivity.md)
- [API Tool Route and Feature Entry](api-tool/README.md)
- [Route Error and Not Found](shared/feature-route-error-and-not-found.md)
- [Legacy Route Redirects](shared/feature-legacy-route-redirects.md)
- [Legacy Exact-Path Redirect Map](shared/feature-legacy-route-exact-path-map.md)
