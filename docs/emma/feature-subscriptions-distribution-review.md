# EMMA Subscriptions Distribution Review

## Overview

Use `Review` in `/emma/plans/{planId}` to export plan results. If your wallet
is a subscriptions admin wallet, this step also lets you prepare and publish
The Memes token distribution outputs.

## Location in the Site

- Route: `/emma/plans/{planId}`
- Step: `Review`
- Surfaces: review table, subscriptions footer (admin only), token confirmation
  modal

## Entry Points

1. Open `Tools -> EMMA`.
2. Open a plan from `/emma/plans`.
3. Move to `Review` from the plan sidebar, or reopen a plan already on this
   step.

## Access and Visibility

- All plan users:
  - can export `JSON`, `CSV`, and `Manifold` for normal phase/component rows.
- Subscriptions admins:
  - get an extra synthetic `Public` phase row.
  - get phase-level `Subscription Lists` / `Public Subscriptions` downloads.
  - get footer actions: `Change Token ID`, `Reset Subscriptions`, `Upload
    Automatic Airdrops`, `Upload Distribution Photos`, `Finalize Distribution`,
    `Publish to GitHub`.
- Admin users must confirm token ID before footer actions and subscription
  downloads unlock.
- `Confirm Token ID` is blocking (`backdrop="static"` and `keyboard={false}`).
- Token ID is prefilled from the first number in the plan name when available.

## Review Workflow

1. Inspect phase and component rows.
2. Export baseline results (`JSON` / `CSV` / `Manifold`) for normal rows.
3. If you are a subscriptions admin, confirm token ID.
4. Download subscription CSV bundles from phase rows.
5. Upload automatic airdrops and distribution photos from the footer.
6. Run `Finalize Distribution` until the status shows `✅`.
7. Click `Publish to GitHub` when it becomes enabled.
8. Use the GitHub modal to watch progress, then close or retry.

## Subscriptions Action Rules

- Subscription CSV downloads:
  - require admin wallet + confirmed token ID.
  - non-`Public` phase downloads: `airdrops`, `airdrops_unconsolidated`,
    `allowlists`.
  - `Public` phase downloads: `airdrops` only.
- `Reset Subscriptions` resets current `contract + token + plan` data.
- `Upload Automatic Airdrops`:
  - accepts `.csv`, `text/csv`, `text/plain` up to `10MB`.
  - expects `address,value` rows.
  - optional header accepted: `address|wallet` + `count|value`.
  - each row needs valid Ethereum address and non-negative integer value.
  - parse errors are line-specific.
- `Upload Distribution Photos`:
  - accepts `jpeg`, `jpg`, `png`, `gif`, `webp`.
  - max `500MB` per file.
  - warns before replacing existing photos.
- `Finalize Distribution`:
  - runs normalization for the confirmed token.
  - button shows `✅` when normalized, `❌` otherwise.
- `Publish to GitHub`:
  - enabled only when all are true: normalized, photos count > 0, automatic
    airdrops count > 0.
  - disabled state explains the missing requirement via tooltip.
  - while publishing, modal close is blocked.
  - success modal can show message, GitHub folder link, deleted files, uploaded
    files.
  - failure modal shows error and `Retry`.

## Failure and Recovery

- Baseline export failures show toast errors such as `Unauthorized` or
  `Something went wrong, try again`.
- Subscription download failure shows `Download failed: ...`; success shows
  `Download successful`.
- Reset, upload, finalize, and publish failures show toast or modal errors.
- CSV and image validation errors are shown before upload.
- If plan run fails, the warning bar shows `Distribution plan building failed`
  with `Run Analysis`. See [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md).

## Limitations / Notes

- Subscriptions admin access is wallet-gated.
- Subscriptions actions always run against `The Memes` contract context.
- All counters and assets are tied to the confirmed token ID.
- In synthetic `Public` row, `JSON`/`CSV`/`Manifold` buttons are visible but
  disabled by design.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
