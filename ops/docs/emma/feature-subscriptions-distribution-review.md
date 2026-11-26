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

1. Open `About -> Data & Developer Tools -> EMMA`.
2. Open a plan from `/emma/plans`.
3. Move to `Review` from the plan sidebar, or reopen a plan already on this
   step.

## Access and Visibility

- All plan users:
  - can export `JSON`, `CSV`, and `Manifold` for normal phase/component rows.
- Subscriptions admins:
  - get an extra synthetic `Public` phase row.
  - get phase-level `Subscription Lists` / `Public Subscriptions` downloads
    after choosing manual preparation or completing a background job.
  - get footer controls: `Change Token ID`, `Reset Subscriptions`,
    `Artist Airdrops`, `Team Airdrops`, `Distribution Photos`,
    the preparation controls, and `Publish to GitHub`.
- Admin users must confirm token ID before footer actions and subscription
  downloads unlock.
- `Confirm Token ID` is blocking (`backdrop="static"` and `keyboard={false}`).
- Token ID is prefilled from the first number in the plan name when available.

## Review Workflow

1. Inspect phase and component rows.
2. Export baseline results (`JSON` / `CSV` / `Manifold`) for normal rows.
3. If you are a subscriptions admin, confirm token ID.
4. Use the footer controls to upload artist/team allocations and distribution photos.
5. Choose a preparation mode for the confirmed token.
   - **Prepare manually** opens the phase controls. Download `Subscription Lists`
     for Phase 0, Phase 1 and Phase 2 in order. Download `Public Subscriptions`,
     then click `Finalize Distribution`. You can still select **Process and
     Finalize** before the first manual write succeeds.
   - **Process and Finalize** starts a background job. The preparation row shows
     the current step out of five, and refreshing restores progress.
     If authorization expires before input capture, click `Sign in to resume`.
     `Download lists` appears in each phase and Public row once the job
     completes with matching phase inputs. The preparation row then says
     **Completed · Lists ready to download**.
6. In manual mode, `Finalize Distribution` and `Publish to GitHub` share
   the finishing row. A red × beside `Finalize Distribution` indicates that
   the distribution still needs finalization, and a green check shows it is
   finalized. In background mode, finalization is part of processing.
   Click `Publish to GitHub` when it becomes enabled and follow its modal.
   The information button next to **Prepare distribution** explains both
   methods and the effects of resetting.

## Subscriptions Action Rules

- Subscription CSV downloads:
  - require admin wallet + confirmed token ID.
  - non-`Public` phase downloads: `airdrops`, `airdrops_unconsolidated`,
    `allowlists`.
  - `Public` phase downloads: `airdrops` only.
- `Reset Subscriptions` clears subscriber work for the confirmed token and
  restores both preparation choices. Artist and team uploads are kept. If a
  background step is still running, retry the reset once the step finishes.
- `Artist Airdrops` and `Team Airdrops`:
  - each footer group provides upload, view, and CSV download controls for one
    airdrop phase.
  - the row shows wallet and token counts from the current distribution overview.
  - uploads accept pasted CSV text or `.csv`, `text/csv`, `text/plain` files up
    to `10MB`.
  - downloaded CSVs include an `address,count` header. File uploads accept
    that header or a headerless CSV. Paste only wallet-and-count data rows.
  - each line must contain exactly one valid Ethereum address and one positive
    integer count.
  - uploads replace the current artist/team airdrop list for the confirmed
    token.
  - the viewer modal shows `Addresses: N | Count: M` plus wallet/amount rows.
  - CSV download is disabled when the current phase count is zero.
- `Distribution Photos`:
  - accepts `jpeg`, `jpg`, `png`, `gif`, `webp`.
  - max `500MB` per file.
  - warns before replacing existing photos.
  - `Distribution Photos` viewer opens a thumbnail grid for the confirmed token.
  - clicking a thumbnail opens a full-size lightbox; a separate icon opens the
    source image in a new tab.
- `Process and Finalize`:
  - requires a distribution plan, a confirmed token ID, and one phase each
    for 0, 1, and 2. Names like `Phase 1`, `Phase1`, `P 1`, `P1`, and `1`
    are equivalent, regardless of case. Missing or duplicate phases are shown
    beside the action. A phase can have zero wallets. Public is generated
    automatically.
  - shows processing, completed, failed or sign-in-required status from a durable backend job.
  - `Sign in to resume` renews the current admin's authorization for the same job.
    Captured inputs and completed checkpoints are preserved. Once inputs are
    saved, later processing and finalization continue without the login token.
  - snapshot inputs remain consistent across the operation. Conflicting uploads
    are rejected while the job is active. Reset clears the job between steps.
  - changed phase selections or distribution inputs require explicit reset and
    processing again. Subscription downloads unlock only for completed matching
    jobs; baseline plan exports retain their existing behavior.
  - if a saved active or completed job has different phase selections, processing
    stays disabled. Progress takes priority while the job runs. If a reset is
    still required after it stops, the panel shows reset guidance. A reset
    invalidates the old job and allows a new operation. To resume the existing
    job, restore the original phase selections and sign in.
- `Publish to GitHub`:
  - enabled only when all are true: normalized, photos count > 0, combined
    artist/team airdrops count > 0.
  - the finishing row explains the current publishing requirement when disabled.
  - while publishing, modal close is blocked.
  - success modal can show message, GitHub folder link, deleted files, uploaded
    files.
  - failure modal shows error and `Retry`.

## Failure and Recovery

- Baseline export failures show toast errors such as `Unauthorized` or
  `Something went wrong, try again`.
- Subscription download failure shows `Download failed: ...`; success shows
  `Download successful`.
- Airdrop and photo viewers can show inline loading, empty, or error states
  without leaving `Review`.
- Reset, upload, process and publish failures show toast or inline errors.
- A failed process can be retried after correcting its cause. Refresh checks
  the current job before starting another; completed downloads never retry writes.
- CSV and image validation errors are shown before upload.
- If plan run fails, the warning bar shows `Distribution plan building failed`
  with `Run Analysis`. See [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md).

## Limitations / Notes

- Subscriptions admin access is wallet-gated.
- Subscriptions actions always run against `The Memes` contract context.
- All counters and assets are tied to the confirmed token ID.
- Artist and team airdrops are tracked separately and are combined only for the
  GitHub publish requirement.
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
