# Tools Index

## Overview

The Tools index is a direct secondary route at `/tools`. It groups utility
routes into category sections, but it is not a primary sidebar or app drawer
destination; primary discovery for these routes lives under About.

## Location in the Site

- Route: `/tools`
- Primary menu: not shown as a top-level sidebar or app drawer item
- Menu discovery: `About -> Data & Developer Tools` and related About groups

## Entry Points

- Open `/tools` directly.
- Use the About index or About menu groups for user-facing tool, developer, and
  open-data destinations.

## User Journey

1. Open `/tools`.
2. Scan the category headings.
3. Select a label-only tool card.
4. The selected route opens using its canonical path.

## Common Scenarios

- Use `NFT Delegation` for Delegation Center, wallet architecture, delegation
  FAQ, consolidation use cases, and wallet checker routes.
- Use `The Memes Tools` for Subscriptions Report, Meme Accounting, and Meme Gas.
- Use `Builder Tools` for App Wallets when supported, API docs, EMMA, and Block
  Finder.
- Use `Open Data` for the Open Data hub and dataset routes including network
  metrics, meme subscriptions when visible, 6529bot usage, Rememes, Team, and
  Royalties.

## Edge Cases

- On restricted iOS contexts, subscription-only links are hidden from the Tools
  index and About menu surfaces.
- App Wallets appears only when app-wallet support is available in the current
  runtime.
- Private or local-only routes, such as 6529bot admin and agent login, are not
  listed on the public Tools index.

## Failure and Recovery

- If a linked tool has its own unsupported, empty, loading, or error state, that
  state is handled by the destination route.
- If a user cannot find a tool on `/tools`, check whether the route is gated by
  app-wallet support, subscription visibility rules, or operator-only access.

## Limitations / Notes

- The Tools index is navigation only. It does not run the tools inline.
- Tool cards intentionally show only labels, without per-card descriptions.
- The route is secondary/direct. Do not document it as a primary navigation
  concept.

## Related Pages

- [API Tool Index](README.md)
- [API Authentication and Media Drop Flow](feature-api-authentication-and-media-drop-flow.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Open Data Hub](../open-data/feature-open-data-hub.md)
