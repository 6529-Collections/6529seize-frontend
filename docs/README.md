# Documentation

User-facing docs for routes, actions, loading states, empty states, failure
states, and recovery paths.

## Quick Start

1. If you know the user goal, start in **Task Entry Points**.
2. If you know the route family, start in **Area Index**.
3. Read pages in this order: `feature-*`, then `flow-*`, then
   `troubleshooting-*`.

## Task Entry Points

- Start at `/` and home sections: [Home](home/README.md)
- Browse wave lists and threads:
  [Waves](waves/README.md), [Waves Discovery](waves/discovery/README.md),
  [Waves Chat](waves/chat/README.md)
- Create waves or direct messages: [Waves Create](waves/create/README.md)
- Post or edit drops: [Waves Composer](waves/composer/README.md)
- Vote, react, curate, and share: [Waves Drop Actions](waves/drop-actions/README.md)
- Open profile routes and tabs:
  [Profiles](profiles/README.md),
  [Profile Troubleshooting](profiles/troubleshooting/README.md)
- Browse memes, collections, and minting routes: [Media](media/README.md)
- Check notifications and app push behavior:
  [Notifications](notifications/README.md)
- Follow live NFT activity and socket behavior: [Realtime](realtime/README.md)
- Check metrics, scores, and TDH/xTDH behavior: [Network](network/README.md)
- Manage network groups and scoped views:
  [Groups](groups/README.md),
  [Network Group Scope Flow](network/flow-network-group-scope.md)
- Run delegation actions and wallet checks: [Delegation](delegation/README.md)
- Run EMMA distribution-plan operations: [EMMA](emma/README.md)
- Open NextGen collection, token, mint, and admin routes:
  [NextGen](nextgen/README.md)
- Download datasets and open export routes: [Open Data](open-data/README.md)
- Use app shell navigation and mobile handoff:
  [Navigation](navigation/README.md)
- Use utility routes under `/tools/*`: [API Tool](api-tool/README.md)
- Debug cross-route shared behavior: [Shared](shared/README.md)

## Route Coverage

Route patterns use normalized placeholders: `{param}` for one segment,
`{param+}` for one-or-more segments, and `{param*}` for zero-or-more segments.

### In Scope

- Home and wave routes:
  `/`, `/discover`, `/waves`, `/waves/{waveId}`, `/waves/create`,
  `/messages`, `/messages/create` (thread can also be selected with
  `wave={waveId}` query param on `/messages`)
- Profile routes:
  `/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/followers`,
  `/{user}/groups`, `/{user}/identity`, `/{user}/proxy`, `/{user}/stats`,
  `/{user}/subscriptions`, `/{user}/waves`, `/{user}/xtdh`,
  `/about/primary-address`
- Media routes:
  `/the-memes`, `/the-memes/mint`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`, `/6529-gradient`, `/6529-gradient/{id}`,
  `/meme-lab`, `/meme-lab/collection/{collection}`, `/meme-lab/{id}`,
  `/meme-lab/{id}/distribution`, `/rememes`, `/rememes/add`,
  `/rememes/{contract}/{id}`, `/meme-calendar`
- Notifications and realtime routes:
  `/notifications`, `/nft-activity`
- Network and groups routes:
  `/network`, `/network/activity`, `/network/definitions`,
  `/network/groups`, `/network/health`, `/network/health/network-tdh`,
  `/network/levels`, `/network/nerd/{param*}`, `/network/prenodes`,
  `/network/tdh`, `/network/tdh/historic-boosts`, `/network/xtdh`, `/xtdh`
- Delegation, NextGen, and EMMA routes:
  `/delegation`, `/delegation/{param+}`, `/nextgen`, `/nextgen/{param*}`,
  `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Tools and open-data routes:
  `/tools/api`, `/tools/block-finder`, `/tools/subscriptions-report`,
  `/tools/app-wallets`, `/tools/app-wallets/import-wallet`,
  `/tools/app-wallets/{id}`, `/open-data`, `/open-data/meme-subscriptions`,
  `/open-data/network-metrics`, `/open-data/rememes`, `/open-data/royalties`,
  `/open-data/team`
- Shared app-shell behavior:
  [Navigation](navigation/README.md) and [Shared](shared/README.md)

### Out of Scope

- Content/editorial/legal routes:
  `/about/*` (except `/about/primary-address`), `/museum`, `/museum/*`,
  `/blog/*`, `/news/*`, `/city/*`, `/om`, `/om/*`, `/education`,
  `/education/*`, `/capital`, `/capital/*`, `/author/*`, `/category/*`,
  `/buidl`, `/casabatllo`
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

- [Home](home/README.md): `/`
- [Waves](waves/README.md): `/discover`, `/waves`, `/waves/{waveId}`,
  `/waves/create`, `/messages`, `/messages/create`
- [Profiles](profiles/README.md): `/{user}`, tab routes under `/{user}/*`, and
  `/about/primary-address`
- [Media](media/README.md): `/the-memes`, `/the-memes/{param*}`,
  `/6529-gradient`, `/6529-gradient/{param*}`, `/meme-lab`,
  `/meme-lab/{param*}`, `/rememes`, `/rememes/{param*}`, `/meme-calendar`
- [Notifications](notifications/README.md): `/notifications`
- [Realtime](realtime/README.md): `/nft-activity`
- [Network](network/README.md): `/network/*`, `/network/xtdh`, `/xtdh`
- [Groups](groups/README.md): `/network/groups`
- [Delegation](delegation/README.md): `/delegation` and `/delegation/{param+}`
- [NextGen](nextgen/README.md): `/nextgen` and `/nextgen/{param*}`
- [API Tool](api-tool/README.md): `/tools/api`, `/tools/block-finder`,
  `/tools/subscriptions-report`, `/tools/app-wallets`,
  `/tools/app-wallets/import-wallet`, `/tools/app-wallets/{id}`
- [EMMA](emma/README.md): `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- [Open Data](open-data/README.md): `/open-data`, `/open-data/meme-subscriptions`,
  `/open-data/network-metrics`, `/open-data/rememes`, `/open-data/royalties`,
  `/open-data/team`
- [Navigation](navigation/README.md): shell controls and `/open-mobile`
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
- [Realtime Connectivity](realtime/troubleshooting-realtime-connectivity.md)
- [Network Routes and Health](network/troubleshooting-network-routes-and-health.md)
- [Groups List and Create Actions](groups/troubleshooting-groups-list-and-create-actions.md)
- [Delegation Routes and Actions](delegation/troubleshooting-delegation-routes-and-actions.md)
- [EMMA Access and Plan Operations](emma/troubleshooting-emma-access-and-plan-operations.md)
- [Media Routes and Minting](media/troubleshooting-media-routes-and-minting.md)
- [NextGen Routes, Mint, and Admin](nextgen/troubleshooting-nextgen-routes-mint-and-admin.md)
- [NextGen Slideshow and Token Media](nextgen/troubleshooting-nextgen-slideshow-and-token-media.md)
- [Open Data Routes and Download States](open-data/troubleshooting-open-data-routes-and-downloads.md)
- [API Tool Route and Feature Entry](api-tool/README.md)
- [Route Error and Not Found](shared/feature-route-error-and-not-found.md)
- [Legacy Route Redirects](shared/feature-legacy-route-redirects.md)
- [Legacy Exact-Path Redirect Map](shared/feature-legacy-route-exact-path-map.md)
