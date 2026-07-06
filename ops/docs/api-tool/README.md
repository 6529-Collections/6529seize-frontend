# API Tool

API Tool docs cover direct `/tools` and `/tools/*` utility routes, plus the
private `/tools/6529bot/admin` operator page.

## Overview

- `/tools`: direct secondary landing page for grouped tool navigation.
- `/tools/api`: static guide for API terminology, authentication quickstart,
  and multipart media-drop requests.
- `/tools/api/authentication`: external-client session-v2 API authentication
  guide.
- `/tools/block-finder`: estimate the closest block for a timestamp, or find
  block numbers that include selected sequences across a configurable window
  (`1 minute` to `2 days`).
- `/tools/subscriptions-report`: read-only aggregate counts for upcoming and
  redeemed The Memes subscriptions.
- `/tools/app-wallets*`: create, import, and manage app-local wallets when
  runtime app-wallet support is available (supported native app environments).
- `/tools/6529bot/admin`: private operator dashboard for central
  `6529reviewbot` spend, budgets, alerts, and worker health.

## Read Order

1. Start with `Tools Index` for the grouped direct `/tools` landing page.
2. Read `API Authentication` for the full external-client session-v2 auth
   guide.
3. Read `API Authentication and Media Drop Flow` for the `/tools/api`
   quickstart, multipart upload, and drop creation examples.
4. Read `Block Finder` for timestamp lookup, include-sequence windows, and
   result detail actions.
5. Read `Memes Subscriptions Report` for aggregate subscription reporting.
6. Read `App Wallets Management` for native app-wallet setup, recovery, and
   unsupported-state behavior.
7. Read `6529bot Admin` for the private bot operator route and auth boundary.

## Route Coverage

- `/tools`
- `/tools/api`
- `/tools/api/authentication`
- `/tools/block-finder`
- `/tools/subscriptions-report`
- `/tools/app-wallets`
- `/tools/app-wallets/import-wallet`
- `/tools/app-wallets/{appWalletAddress}`
- `/tools/6529bot/admin`

## Localization Notes

- `/tools/api/authentication` and the new authentication quickstart copy on
  `/tools/api` use `en-US` source messages with non-source locales falling back
  through the shared `t()` helper.
- `/tools/api` still has legacy hardcoded en-US copy in the Introduction, Key
  terminology, and Creating drops with embedded media sections. Current
  fallback behavior is direct hardcoded en-US rendering. Owner: frontend docs
  and i18n migration. Remediation path: move the remaining `/tools/api` section
  headings, body copy, list items, and metadata into `i18n/messages/en-US.ts`
  during the broader API page localization pass.

## Navigation and Visibility

- Web sidebar paths:
  - `About -> Data & Developer Tools -> API`
  - `About -> Data & Developer Tools -> Block Finder`
  - `About -> Data & Developer Tools -> Subscriptions Report`
  - `About -> Delegation & Wallets -> App Wallets` (only when app-wallet
    support is enabled)
- Native app sidebar paths:
  - `About -> Data & Developer Tools -> API`
  - `About -> Data & Developer Tools -> Block Finder`
  - `About -> Data & Developer Tools -> Subscriptions Report`
  - `About -> Delegation & Wallets -> App Wallets` (only when app-wallet
    support is enabled)
- When app-wallet support is unavailable, direct `/tools/app-wallets*` routes
  still load but show an unsupported message panel instead of wallet controls.
- `6529bot Admin` is direct-route only. It is not listed in sidebar menus and
  fails closed unless deployment config, 6529 wallet auth, and the server-side
  operator allowlist all pass.
- The public `/tools` landing page does not list private operator or local-only
  routes.
- On iOS outside the US, `Subscriptions Report` is hidden in web sidebar and
  search.
- On native app, the About drawer uses the same `Subscriptions Report` label
  when visible.
- Direct route access still works when a menu row is hidden.

## Features

1. [Tools Index](feature-tools-index.md)
2. [API Authentication](feature-api-authentication.md)
3. [API Authentication and Media Drop Flow](feature-api-authentication-and-media-drop-flow.md)
4. [Block Finder](feature-block-finder.md)
5. [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
6. [App Wallets Management](feature-app-wallets.md)
7. [6529bot Admin](feature-6529bot-admin.md)

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
- [6529bot Usage](../open-data/feature-6529bot-usage.md)
