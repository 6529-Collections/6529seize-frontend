# EMMA Custom Snapshot Wallet Batching

## Overview

The `Create Custom Snapshot` step in EMMA lets users assemble a wallet list and
create custom snapshots from that list. Large wallet lists are split
automatically into multiple snapshots.

## Location in the Site

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Navigation path: `Tools -> EMMA`
- In-plan step: `Create Custom Snapshot` (right-side progress navigation)

## Entry Points

- Open `Tools -> EMMA`, connect wallet, and sign in.
- Open an existing plan from `/emma/plans`, or create a new one first.
- Inside `/emma/plans/{planId}`, select the `Create Custom Snapshot` step.
- Optionally download `Download example CSV file` from the step header.

## User Journey

1. Open `Create Custom Snapshot` in a plan.
2. Enter a base snapshot name.
3. Select `Add wallets` and add wallets manually or with CSV upload.
4. Review the projected split summary (`We will split ... into ...`).
5. Submit with `Add custom snapshot` or `Add N custom snapshots`.
6. Watch chunked creation progress (`Creating snapshot X of Y...`).
7. Review created snapshot rows in the table (`Name`, `Wallets`, `Tokens`).
8. Continue to the next step, or use `Skip` when no custom snapshots are added.

## Common Scenarios

- Add up to 500 wallets and create one snapshot named `{baseName}-1`.
- Upload a larger list (for example 1,100 wallets) and create
  `{baseName}-1`, `{baseName}-2`, `{baseName}-3` automatically.
- Combine manual wallet entry and CSV-uploaded rows before submitting.
- Use CSV files with an optional `Owner` header and comma/semicolon separators.

## Edge Cases

- One custom snapshot contains at most 500 wallets.
- One submission batch can include at most 100,000 wallets.
- CSV upload keeps only valid Ethereum addresses from the first column.
- Manual entry accepts Ethereum addresses and `.eth` names.
- Duplicate wallets are not removed before snapshot creation.
- The summary and submit-button label update as wallet count changes.

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
- If one chunk fails, the run stops at that chunk and shows
  `Failed to create snapshot "<baseName>-N". Please try again.`. Earlier
  successful chunks remain created and visible in the table.

## Limitations / Notes

- Snapshot creation runs sequentially per chunk and can take longer on large
  wallet lists.
- Snapshot names are always suffixed with an incrementing index (`-1`, `-2`,
  ...).
- CSV upload accepts Ethereum addresses only; `.eth` rows in CSV are ignored.

## Related Pages

- [EMMA Index](README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [API Tool Index](../api-tool/README.md)
- [Docs Home](../README.md)
