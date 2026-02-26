# EMMA

## Overview

Use EMMA docs for distribution-plan work at `/emma`, `/emma/plans`, and
`/emma/plans/{planId}`.

Primary jobs in this area:

- Connect wallet and sign in to EMMA.
- Create, open, and delete plans.
- Move through plan steps from snapshots to review.
- Run analysis and recover from failed runs.
- For Memes admin plans, manage subscription distribution and publish outputs.

## Features

- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md): connect, sign in, create plans, open saved plans, and delete plans.
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md): add wallets manually or by CSV and auto-split large uploads into multiple custom snapshots.
- [Map Delegations](feature-map-delegations.md): optionally add one delegation contract, run analysis when required, then continue to `Review`.
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md): confirm token ID, upload photos and automatic airdrops, finalize, and publish to GitHub.

## Flows

- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md): end-to-end step flow (`Create Plan` -> `Review`), `Run analysis` gating, active-run blocking, and failed-run retry.

## Troubleshooting

- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md): recover sign-in failures, plan-load redirects, run failures, and disabled publish actions.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [API Tool Index](../api-tool/README.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
