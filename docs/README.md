# Documentation

This index covers current user-facing behavior: routes, actions,
loading/empty/error states, and recovery paths.

## Start Here

1. Find your route family in the route map below.
2. Open that area `README.md`.
3. Read `feature-*` pages first, then `flow-*`, then `troubleshooting-*`.

## I Need To...

- Browse waves and open threads:
  [Waves Discovery](waves/discovery/README.md), [Waves Chat](waves/chat/README.md)
- Create a wave or direct message: [Waves Create](waves/create/README.md)
- Post, edit, and submit drop content: [Waves Composer](waves/composer/README.md)
- Vote, react, curate, and copy/share links:
  [Waves Drop Actions](waves/drop-actions/README.md)
- Open profile tabs or fix profile route issues:
  [Profiles](profiles/README.md),
  [Profile Troubleshooting](profiles/troubleshooting/README.md)
- Check network metrics, definitions, and xTDH/TDH rules: [Network](network/README.md)
- Manage groups and group-scoped network views:
  [Groups](groups/README.md),
  [Network Group Scope Flow](network/flow-network-group-scope.md)
- Run delegation actions and wallet checks: [Delegation](delegation/README.md)
- Run EMMA plan and distribution operations: [EMMA](emma/README.md)
- Download Open Data datasets: [Open Data](open-data/README.md)
- Use app shell navigation and mobile handoff: [Navigation](navigation/README.md)
- Use `/tools/*` routes for API and utility workflows: [API Tool](api-tool/README.md)

## Scope

### In-Scope Routes

- Home and waves: `/`, `/discover`, `/waves`, `/waves/{waveId}`,
  `/waves/create`, `/messages`, `/messages/create`,
  `/messages?wave={waveId}`
- Profiles: `/{user}`, `/{user}/*`, and `/about/primary-address`
- Media: `/the-memes*`, `/6529-gradient*`, `/meme-lab*`, `/rememes*`,
  and `/meme-calendar`
- Ops and data: `/notifications`, `/network`, `/network/*`, `/network/groups`,
  `/xtdh`, `/delegation/*`, `/nextgen/*`, `/nft-activity`, `/tools/*`,
  `/open-data`, `/open-data/*`, `/emma/*`, and `/open-mobile`
- Cross-area shell behavior:
  [Navigation](navigation/README.md) and [Shared](shared/README.md)

### Out-of-Scope Routes

- Content/editorial/legal routes: `/about/*` (except `/about/primary-address`),
  `/museum/*`, `/blog/*`, `/news/*`, `/city/*`, `/om/*`, `/education/*`,
  `/capital/*`, `/author/*`, `/category/*`, `/buidl`, `/casabatllo`
- Standalone utility routes: `/access`, `/restricted`, `/dispute-resolution`,
  `/accept-connection-sharing`, `/email-signatures`,
  `/consolidation-mapping-tool`, `/delegation-mapping-tool`,
  `/meme-accounting`, `/meme-gas`
- Legacy feed redirect route: `/feed` redirects to `/index.xml`
- Legacy and diagnostics routes: `/slide-page/*`, `/element_category/*`,
  `/gm-or-die-small-mp4`, `/cdn-cgi/l/email-protection`, `/error`,
  and `/sentry-example-page`

## Route-to-Area Map

- `/` -> [Home](home/README.md)
- `/discover`, `/waves`, `/waves/{waveId}`, `/waves/create`, `/messages`,
  `/messages/create`, `/messages?wave={waveId}` -> [Waves](waves/README.md)
- `/{user}`, `/{user}/*`, and `/about/primary-address` ->
  [Profiles](profiles/README.md)
- `/the-memes*`, `/6529-gradient*`, `/meme-lab*`, `/rememes*`,
  and `/meme-calendar` -> [Media](media/README.md)
- `/notifications` -> [Notifications](notifications/README.md)
- `/network`, `/network/*`, and `/xtdh` -> [Network](network/README.md)
- `/network/groups` -> [Groups](groups/README.md)
- `/delegation/*` -> [Delegation](delegation/README.md)
- `/nextgen/*` -> [NextGen](nextgen/README.md)
- `/nft-activity` -> [Realtime](realtime/README.md)
- `/tools/*` -> [API Tool](api-tool/README.md)
- `/open-data` and `/open-data/*` -> [Open Data](open-data/README.md)
- `/emma/*` -> [EMMA](emma/README.md)
- `/open-mobile` -> [Navigation](navigation/README.md)
- Shared shell and route behavior -> [Navigation](navigation/README.md) and
  [Shared](shared/README.md)

## Area Index

### Core Product Journeys

- [Home](home/README.md): `/` landing behavior
- [Waves](waves/README.md): discovery, creation, chat, and drop actions for
  `/discover`, `/waves`, `/waves/{waveId}`, `/waves/create`, `/messages`,
  `/messages?wave={waveId}`, and `/messages/create`
- [Profiles](profiles/README.md): `/{user}` routes and `/about/primary-address`
- [Media](media/README.md): `/the-memes`, `/6529-gradient`, `/meme-lab`,
  `/rememes`, and `/meme-calendar`
- [Notifications](notifications/README.md): `/notifications` feed and push controls
- [Network](network/README.md): `/network` and `/network/*` score, health, and
  rules views

### Operations and Data

- [Groups](groups/README.md): `/network/groups` list, create, and edit flows
- [Delegation](delegation/README.md): `/delegation/*` action routes, wallet
  checks, and onchain feedback
- [NextGen](nextgen/README.md): `/nextgen/*` browsing, mint/distribution, token
  media, and manager access
- [Realtime](realtime/README.md): `/nft-activity` feed plus live-update
  connectivity behavior
- [API Tool](api-tool/README.md): `/tools/api`, `/tools/block-finder`,
  `/tools/subscriptions-report`, and optional `/tools/app-wallets*`
- [EMMA](emma/README.md): `/emma/*` plan and distribution operations
- [Open Data](open-data/README.md): `/open-data` and `/open-data/*` datasets
  and downloads

### Shared Cross-Area Behavior

- [Navigation](navigation/README.md): cross-route switching, shell controls,
  search, and `/open-mobile` handoff
- [Shared](shared/README.md): route-level and UI behavior reused by multiple
  areas

### Subarea Indexes

- Waves subareas: [Discovery](waves/discovery/README.md),
  [Create](waves/create/README.md), [Chat](waves/chat/README.md),
  [Composer](waves/composer/README.md),
  [Drop Actions](waves/drop-actions/README.md),
  [Header](waves/header/README.md), [Sidebars](waves/sidebars/README.md),
  [Link Previews](waves/link-previews/README.md),
  [Leaderboard](waves/leaderboard/README.md),
  [Memes](waves/memes/README.md)
- Profiles subareas: [Navigation](profiles/navigation/README.md),
  [Tabs](profiles/tabs/README.md), [About](profiles/about/README.md),
  [Troubleshooting](profiles/troubleshooting/README.md)
- Media subareas: [Memes](media/memes/README.md),
  [Collections](media/collections/README.md), [NFT](media/nft/README.md),
  and [Rendering](media/rendering/README.md)

## Troubleshooting Entry Point

Use this section when a route is blocked, data is missing, or an action fails.

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
