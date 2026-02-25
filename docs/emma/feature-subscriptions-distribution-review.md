# EMMA Subscriptions Distribution Review

## Overview

The EMMA plan review table includes a dedicated subscription review workflow for
The Memes plans. Admin users can confirm a token ID, download subscription
lists, upload photos and automatic airdrops, and finalize distribution state
from the plan review area.

## Location in the Site

- Route: `/emma/plans/{planId}`
- Context: `Review` tab/table in the plan page
- Area: EMMA distribution plan review tools

## Entry Points

- Open `Tools -> EMMA`.
- Open a Memes distribution plan from `/emma/plans` and navigate to
  `Review` for that plan.
- Open an existing plan step-by-step and reach the distribution review table.

## User Journey

1. Open the plan review table in the `Review` section.
2. If no token ID has been confirmed yet, complete the `Confirm Token ID` step.
3. Confirmed-token mode exposes:
   - phase-level subscription-download buttons
   - an admin footer with reset, upload, and finalize actions.
4. Download phase CSVs directly from the matching phase row.
5. Use footer actions to manage distribution assets and finalization.

## Common Scenarios

- Manage phase subscription lists:
  - phase-level download buttons are only visible after a token ID is confirmed.
  - admin users can download phase subscription CSV bundles directly from rows.
  - public subscription list is shown as a synthetic `Public` row.
- Admin setup flow:
  - Confirm token ID once at load.
  - Use `Change Token ID` to swap token context if needed.
- Distribution operations:
  - `Reset Subscriptions` clears working subscriptions for the plan/token.
  - `Upload Distribution Photos` replaces existing photos for that token when
    any already exist.
  - `Upload Distribution Photos` supports multiple images up to 500MB each and
    accepts JPEG, PNG, GIF, and WEBP file types.
  - `Upload Automatic Airdrops` accepts a CSV with `address,value` rows.
  - `Finalize Distribution` runs the normalize step and updates the normalized
    indicator (`✅` or `❌`).
- Use the footer status counters as a quick state check:
  - photos uploaded count
  - automatic airdrops addresses + total count
  - normalized state indicator

## Edge Cases

- Token ID is required for all subscription-review actions in admin mode.
- Non-admin viewers only see standard review table rows; admin controls are hidden.
- `Public` subscription rows show only the subscription-list action and
  hide regular JSON/CSV/Manifold download actions used for phase rows.
- Upload paths validate content and reject invalid formats before server calls:
  - automatic airdrops CSV parser errors report parse/format/validation issues.
  - photo uploads require valid image files and enforce size/type limits before
    upload.

## Failure and Recovery

- Network/request failures show toast errors and keep previous UI state visible.
- Modal flows surface error copy for CSV or file validation failures, and users can
  retry after fixing the input or network issue.

## Limitations / Notes

- Phase download actions are gated by admin status.
- `Finalize Distribution` requires confirmed token context.
- Subscription review assets are token-specific under the selected contract-token
  context.

## Related Pages

- [EMMA Index](README.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
