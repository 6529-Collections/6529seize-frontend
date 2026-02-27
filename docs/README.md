# Documentation

This index points to user-facing behavior docs: routes, flows, and recovery paths.

Editorial and content routes are out of scope (for example `/about/*`, `/museum/*`,
`/blog/*`, `/news/*`, and `/city/*`).  
Profile `about/*` behavior is documented under [Profiles](profiles/README.md).

## Start here

1. Pick your goal area from the index below.
2. Open that area `README.md` for scope and ownership.
3. Open the feature or flow page for exact behavior and recovery details.
4. Open troubleshooting if a route, action, or state fails.
5. Open a shared-page in [Shared](shared/README.md) or [Navigation](navigation/README.md) when behavior is reused.

## Documentation scope map

### Core journey (high-frequency tasks)

- [Home](home/README.md): first-run and landing flow at `/`.
- [Navigation](navigation/README.md): route switching, app-shell controls, and search at `/discover`, `/waves`, `/messages`, and `/network`.
- [Waves](waves/README.md): discover, create, chat, and interact with drops at `/discover`, `/waves`, `/waves/{id}`, and `/messages`.
- [Profiles](profiles/README.md): profile routes and tab behavior at `/[user]` and `/username/waves`.
- [Media](media/README.md): NFT/media surfaces, minting, and rendering at `/6529-gradient`, `/the-memes`, `/meme-lab`, `/rememes`, and `/meme-calendar`.
- [Notifications](notifications/README.md): `/notifications` feed behavior, filtering, and push settings.
- [Network](network/README.md): scoring, leaderboards, health, and TDH/xTDH rules.

### Product operations

- [Groups](groups/README.md): `/network/groups` listing, creation, and edits.
- [Delegation](delegation/README.md): `/delegation/*` routing, onchain action flows, and wallet diagnostics.
- [NextGen](nextgen/README.md): `/nextgen` browsing, collection routes, mint/distribution operations, token media, and admin access.
- [Realtime](realtime/README.md): `/nft-activity` websocket updates and event-driven feed behavior.
- [API Tool](api-tool/README.md): `/tools/*` API access, block finder, and subscription reports.
- [EMMA](emma/README.md): `/emma/*` distribution-plan operations.
- [Open Data](open-data/README.md): `/open-data/*` dataset routes and download surfaces.
- [Shared](shared/README.md): reusable patterns shared across multiple areas.

## Fast path tasks

Use this when you need the shortest route to the right page.

- Wave discovery flow: [Wave Discovery Index](waves/discovery/README.md)
- Wave thread flow: [Wave Chat Index](waves/chat/README.md)
- Wave creation flow: [Wave Creation Index](waves/create/README.md)
- Meme submission flow: [Memes Submission Flow](waves/memes/feature-memes-submission.md)
- xTDH dashboard plus TDH/xTDH rules: [xTDH Network Overview](network/feature-xtdh-network-overview.md), [xTDH Rules and Distribution Formula](network/feature-xtdh-formulas.md), [Network Definitions](network/feature-network-definitions.md), [TDH Boost Rules](network/feature-tdh-boost-rules.md)
- Search from any route: [Header Search Modal](navigation/feature-header-search-modal.md)
- Navigate instantly between app areas: [Navigation Entry and Switching Flow](navigation/flow-navigation-entry-and-switching.md)
- Read notifications feed flow: [Notifications Feed Browsing Flow](notifications/flow-notifications-feed-browsing.md)
- Follow network groups to filtered scope: [Group to Network Scope Flow](network/flow-network-group-scope.md)
- Mint and schedule meme flows: [The Memes Mint Flow](media/memes/feature-mint-flow.md)
- Debug live updates: [Authenticated Live Updates](realtime/feature-authenticated-live-updates.md)
- Open mobile app handoff links: [Mobile App Landing Page](navigation/feature-mobile-app-landing.md)

## Troubleshooting entry point

Use this when a route is blocked, data is missing, or an action fails.

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
