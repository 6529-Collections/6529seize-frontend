# Documentation

This index maps current user-visible behavior: routes, actions, loading and
error states, and recovery paths.

## Scope

### In-Scope Routes

- `/`, `/discover`, `/waves`, `/waves/{id}`, `/messages`, `/messages/create`
- `/{user}` profile routes and `/about/primary-address`
- `/the-memes*`, `/6529-gradient*`, `/meme-lab*`, `/rememes*`, `/meme-calendar`
- `/notifications`
- `/network/*` and `/network/groups`
- `/delegation/*`
- `/nextgen/*`
- `/nft-activity`
- `/tools/*`
- `/open-data/*`
- `/emma/*`
- Cross-area shell behavior is owned by [Navigation](navigation/README.md) and
  [Shared](shared/README.md)

### Out-of-Scope Routes

- Content/editorial/legal routes: `/about/*` (except `/about/primary-address`),
  `/museum/*`, `/blog/*`, `/news/*`, `/city/*`, `/om/*`, `/education/*`,
  `/capital/*`
- Standalone utility routes: `/access`, `/restricted`, `/dispute-resolution`,
  `/accept-connection-sharing`, `/email-signatures`,
  `/consolidation-mapping-tool`, `/delegation-mapping-tool`

## Start Here

1. Find the route family in the quick map below.
2. Open that area `README.md`.
3. Open feature/flow pages for exact behavior.
4. Use troubleshooting pages when a route or action fails.

## Route-to-Area Quick Map

- `/` -> [Home](home/README.md)
- `/discover`, `/waves`, `/waves/{id}`, `/messages`, `/messages/create` ->
  [Waves](waves/README.md)
- `/{user}` and `/about/primary-address` -> [Profiles](profiles/README.md)
- `/the-memes*`, `/6529-gradient*`, `/meme-lab*`, `/rememes*`,
  `/meme-calendar` -> [Media](media/README.md)
- `/notifications` -> [Notifications](notifications/README.md)
- `/network/*` -> [Network](network/README.md)
- `/network/groups` -> [Groups](groups/README.md)
- `/delegation/*` -> [Delegation](delegation/README.md)
- `/nextgen/*` -> [NextGen](nextgen/README.md)
- `/nft-activity` -> [Realtime](realtime/README.md)
- `/tools/*` -> [API Tool](api-tool/README.md)
- `/open-data/*` -> [Open Data](open-data/README.md)
- `/emma/*` -> [EMMA](emma/README.md)
- Shared shell and route behavior -> [Navigation](navigation/README.md) and
  [Shared](shared/README.md)

## Area Index

### Core Product Journeys

- [Home](home/README.md): landing route behavior at `/`
- [Waves](waves/README.md): discovery, creation, chat, and drop actions at
  `/discover`, `/waves`, `/waves/{id}`, and `/messages`
- [Profiles](profiles/README.md): `/{user}` profile routes and
  `/about/primary-address`
- [Media](media/README.md): `/the-memes`, `/6529-gradient`, `/meme-lab`,
  `/rememes`, and `/meme-calendar`
- [Notifications](notifications/README.md): `/notifications` feed and push
  controls
- [Network](network/README.md): `/network/*` score, health, and rules views

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
- [Open Data](open-data/README.md): `/open-data/*` datasets and downloads

### Shared Cross-Area Behavior

- [Navigation](navigation/README.md): cross-route switching, shell controls,
  search, and `/open-mobile` handoff
- [Shared](shared/README.md): route-level and UI behavior reused by multiple
  areas

## Fast Paths

- Open wave discovery docs: [Wave Discovery Index](waves/discovery/README.md)
- Open wave thread docs: [Wave Chat Index](waves/chat/README.md)
- Open wave creation docs: [Wave Creation Index](waves/create/README.md)
- Submit memes in waves:
  [Memes Submission Flow](waves/memes/feature-memes-submission.md)
- Review xTDH and TDH rules:
  [xTDH Network Overview](network/feature-xtdh-network-overview.md),
  [xTDH Rules and Distribution Formula](network/feature-xtdh-formulas.md),
  [Network Definitions](network/feature-network-definitions.md),
  [TDH Boost Rules](network/feature-tdh-boost-rules.md)
- Search from shell routes:
  [Header Search Modal](navigation/feature-header-search-modal.md)
- Switch routes quickly:
  [Navigation Entry and Switching Flow](navigation/flow-navigation-entry-and-switching.md)
- Read notification flow:
  [Notifications Feed Browsing Flow](notifications/flow-notifications-feed-browsing.md)
- Jump from groups into network scope:
  [Group to Network Scope Flow](network/flow-network-group-scope.md)
- Manage app wallets on supported devices:
  [App Wallets Management](api-tool/feature-app-wallets.md)
- Mint and schedule memes:
  [The Memes Mint Flow](media/memes/feature-mint-flow.md)
- Debug live updates:
  [Authenticated Live Updates](realtime/feature-authenticated-live-updates.md)

## Troubleshooting Entry Point

Use this when a route is blocked, data is missing, or an action fails.

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
- [Route Error and Not Found](shared/feature-route-error-and-not-found.md)
- [Legacy Route Redirects](shared/feature-legacy-route-redirects.md)
