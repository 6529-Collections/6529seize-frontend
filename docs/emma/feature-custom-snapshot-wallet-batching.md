# EMMA Custom Snapshot Wallet Batching

## Overview

Use `Create Custom Snapshot` to build a wallet list and create custom snapshot
operations in `/emma/plans/{planId}`. EMMA splits large lists into multiple
snapshots of up to 500 wallets each.

## Location in the Site

- Route: `/emma/plans/{planId}`
- Plan step: `Create Custom Snapshot` in the right-side step timeline

## Entry Points

- Open `Tools -> EMMA`, complete connect/sign-in, then open a plan.
- Open an existing plan from `/emma/plans`, or create one first.
- In `/emma/plans/{planId}`, select `Create Custom Snapshot`.
- Optional: click `Download example CSV file` to download `data.csv` with an
  `Owner` column sample.

## User Journey

1. Open `Create Custom Snapshot` in a plan.
2. Enter a snapshot base name in `Name`.
3. Click `Add wallets`.
4. In the modal, add wallets with either:
   - manual input (`Wallet address.` + `Add`)
   - `Upload a CSV`
5. Review `Currently added ... This will create ...`, remove unwanted rows with
   `Delete`, then click `Close`.
6. Review the split summary (`We will split ... into ...`).
7. Submit with `Add custom snapshot` or `Add N custom snapshots`.
8. During creation, monitor progress (`Creating snapshot X of Y...` and
   `Finalizing snapshots...`).
9. On success, EMMA shows `Created N custom snapshot(s).`, clears the form, and
   updates the created-snapshots table (`Name`, `Wallets`, `Tokens`).
10. Step navigation behavior:
   - `Skip` is shown when no custom snapshots exist yet.
   - `Next` is shown when at least one custom snapshot exists.

## Common Scenarios

- Add up to 500 wallets and create one snapshot named `<name>-1`.
- Upload a larger list (for example 1,100 wallets) and create
  `<name>-1`, `<name>-2`, `<name>-3` automatically.
- Combine manual wallet entry and CSV-uploaded rows before submitting.
- Use CSV files with an optional `Owner` header and comma or semicolon
  separators.

## Edge Cases

- One custom snapshot contains at most 500 wallets.
- One batch can include at most 100,000 wallets total (manual + CSV combined).
- Manual entry accepts Ethereum addresses and lowercase `.eth` names,
  lowercases input before adding, and requires clicking `Add` (pressing Enter
  does not add).
- ENS names resolve only when submitting `Add custom snapshot`; any ENS
  resolution failure stops the full submit.
- CSV upload reads only the first column, lowercases values, and keeps only
  valid Ethereum addresses.
- `.eth` values in CSV are ignored.
- Duplicate wallets are not deduplicated before creation.
- The split summary and submit label update as wallet count changes.
- The created-snapshot table uses:
  - `Wallets`: unique owner count in the snapshot operation
  - `Tokens`: total submitted rows in the snapshot operation

## Failure and Recovery

- Invalid manual wallet input shows `Invalid wallet address`.
- Uploading a CSV with no valid wallet rows shows
  `No wallets found in the uploaded file`.
- Submitting with no wallets shows `No tokens provided`.
- Submitting with a blank name shows `Name is required`.
- Exceeding the batch limit shows
  `You can upload up to 100,000 wallets per batch`.
- ENS resolution failures show
  `Some ENS addresses could not be resolved` and stop creation.
- If ENS resolution leaves no valid wallets, EMMA shows
  `No valid wallets found after resolving ENS`.
- If one chunk fails, the run stops at that chunk and shows
  `Failed to create snapshot "<baseName>-N". Please try again.`.
- Recovery after chunk failure: fix input and submit again. Previously created
  chunks may exist on the backend; reload/reopen the plan to refresh the table.

## Limitations / Notes

- Snapshot creation runs sequentially per chunk and can take longer on large
  wallet lists.
- Snapshot names always use a numeric suffix (`-1`, `-2`, ...), including
  single-chunk submissions.
- This step does not provide an edit/delete action for already created custom
  snapshots.
- This step uses `Skip`/`Next` controls (no `Run analysis` button on this page).

## Related Pages

- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [API Tool Index](../api-tool/README.md)
- [Docs Home](../README.md)
