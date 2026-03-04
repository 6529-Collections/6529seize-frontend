# API Tool

API Tool docs cover user-facing utility routes under `/tools/*`.

## Overview

- `/tools/api`: static guide for API authentication and multipart media-drop
  requests.
- `/tools/block-finder`: estimate the closest block for a timestamp, or find
  block numbers that include selected sequences across a configurable window
  (`1 minute` to `2 days`).
- `/tools/subscriptions-report`: read-only aggregate counts for upcoming and
  redeemed The Memes subscriptions.
- `/tools/app-wallets*`: create, import, and manage app-local wallets when
  runtime app-wallet support is available (supported native app environments).

## Read Order

1. Start with `API Authentication and Media Drop Flow` for API auth, multipart
   upload, and drop creation examples.
2. Read `Block Finder` for timestamp lookup, include-sequence windows, and
   result detail actions.
3. Read `Memes Subscriptions Report` for aggregate subscription reporting.
4. Read `App Wallets Management` for native app-wallet setup, recovery, and
   unsupported-state behavior.

## Route Coverage

- `/tools/api`
- `/tools/block-finder`
- `/tools/subscriptions-report`
- `/tools/app-wallets`
- `/tools/app-wallets/import-wallet`
- `/tools/app-wallets/{appWalletAddress}`

## Navigation and Visibility

- Web sidebar paths:
  - `Tools -> Other Tools -> API`
  - `Tools -> Other Tools -> Block Finder`
  - `Tools -> The Memes Tools -> Subscriptions Report`
  - `Tools -> Other Tools -> App Wallets` (only when app-wallet support is
    enabled)
- Native app sidebar paths:
  - `Tools -> API`
  - `Tools -> Block Finder`
  - `Tools -> The Memes Tools -> Memes Subscriptions`
  - `Tools -> App Wallets` (only when app-wallet support is enabled)
- When app-wallet support is unavailable, direct `/tools/app-wallets*` routes
  still load but show an unsupported message panel instead of wallet controls.
- On iOS outside the US, `Subscriptions Report` is hidden in web sidebar and
  search.
- On native app, the Tools drawer still lists `Memes Subscriptions`.
- Direct route access still works when a menu row is hidden.

## Features

1. [API Authentication and Media Drop Flow](feature-api-authentication-and-media-drop-flow.md)
2. [Block Finder](feature-block-finder.md)
3. [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
4. [App Wallets Management](feature-app-wallets.md)

## Flows

- Route flows are documented inside each feature page.

## Troubleshooting

- Loading, empty, error, and retry behavior is documented inside each feature
  page.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Meme Subscriptions Open Data](../open-data/feature-meme-subscriptions.md)
