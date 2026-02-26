# Documentation

This section documents user-facing interactive behavior.

Editorial and content-only routes are out of scope here, for example `/about/*`, `/museum/*`, `/blog/*`, `/news/*`, and `/city/*`.

## Start here

1. Pick the area that matches your goal.
2. Open the area `README.md` for ownership and scope.
3. Open a feature or flow page for exact behavior and recovery cases.
4. Open troubleshooting if a route, action, or state is blocked.

## Documentation scope map

### Core journey

- [Home](home/README.md): `/` landing surface and first-run entry.
- [Navigation](navigation/README.md): route switching, shell controls, and search entry.
- [Waves](waves/README.md): discovery, posting, chat, and outcome interactions.
- [Profiles](profiles/README.md): profile routes, tabs, and about-route behavior.
- [Media](media/README.md): NFT and meme surfaces, minting, and media rendering.
- [Notifications](notifications/README.md): `/notifications` feed behavior, filtering, and push settings.
- [Network](network/README.md): scoring, leaderboards, health, and TDH/xTDH rules.

### Product operations

- [Groups](groups/README.md): `/network/groups` listing, creation, and edits.
- [Delegation](delegation/README.md): `/delegation/*` routing and onchain action flows.
- [NextGen](nextgen/README.md): `/nextgen` collection and token-media workflows.
- [Realtime](realtime/README.md): `/nft-activity` websocket updates and event-driven feed behavior.
- [API Tool](api-tool/README.md): `/tools/*` API access, block finder, and subscription reports.
- [EMMA](emma/README.md): `/emma/*` distribution-plan operations.
- [Open Data](open-data/README.md): `/open-data/*` dataset download surfaces.
- [Shared](shared/README.md): reusable patterns shared across multiple areas.

## Fast path tasks

Use this when you need the shortest route to the right page.

- Find active waves and open a thread: [Wave Discovery Index](waves/discovery/README.md)
- Read or post in a wave thread: [Wave Chat Index](waves/chat/README.md)
- Post a new wave: [Wave Creation Index](waves/create/README.md)
- Submit a meme: [Memes Submission Flow](waves/memes/feature-memes-submission.md)
- Search from any route: [Header Search Modal](navigation/feature-header-search-modal.md)
- Move between app areas quickly: [Navigation Entry and Switching Flow](navigation/flow-navigation-entry-and-switching.md)
- Review notifications: [Notifications Feed Browsing Flow](notifications/flow-notifications-feed-browsing.md)
- Debug profile route and tab issues: [Profile Troubleshooting](profiles/troubleshooting/troubleshooting-routes-and-tabs.md)
- Review TDH and xTDH behavior: [TDH Boost Rules](network/feature-tdh-boost-rules.md), [xTDH Network Overview](network/feature-xtdh-network-overview.md), [xTDH Rules and Distribution Formula](network/feature-xtdh-formulas.md)
- Follow network group routing logic: [Group to Network Scope Flow](network/flow-network-group-scope.md)
- Mint or schedule The Memes flow: [The Memes Mint Flow](media/memes/feature-mint-flow.md)
- Debug live updates: [Authenticated Live Updates](realtime/feature-authenticated-live-updates.md)

## Troubleshooting entry point

Use this section when a route is blocked, data is missing, or an action fails.

- [Navigation and Shell Controls](navigation/troubleshooting-navigation-and-shell-controls.md)
- [Wave Navigation and Posting](waves/troubleshooting-wave-navigation-and-posting.md)
- [Profile Routes and Tabs](profiles/troubleshooting/troubleshooting-routes-and-tabs.md)
- [Notifications Feed](notifications/troubleshooting-notifications-feed.md)
- [Network Routes and Health](network/troubleshooting-network-routes-and-health.md)
- [Delegation Routes and Actions](delegation/troubleshooting-delegation-routes-and-actions.md)
- [Media Routes and Minting](media/troubleshooting-media-routes-and-minting.md)
- [NextGen Slideshow and Token Media](nextgen/troubleshooting-nextgen-slideshow-and-token-media.md)
- [Realtime Connectivity](realtime/troubleshooting-realtime-connectivity.md)
- [Route Error and Not Found](shared/feature-route-error-and-not-found.md)
- [Legacy Route Redirects](shared/feature-legacy-route-redirects.md)
