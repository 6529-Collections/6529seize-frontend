# ReMemes Add Submission

## Overview

- `/rememes/add` is the ReMeme submission route.
- Flow: validate contract and token inputs, pass eligibility checks, sign, then
  submit.

## Location in the Site

- Submission route: `/rememes/add`
- Browse route with add entry: `/rememes`

## Entry Points

- Open `/rememes/add` directly.
- From `/rememes`, select `Add ReMeme`.

## User Journey

1. Open `/rememes/add`.
2. Enter `Contract` and `Token IDs`:
   - comma list: `1,2,3`
   - range: `1-3`
   - mixed: `1-3,5`
3. Add one or more `Meme References` from the `+` picker.
4. Select `Validate`.
5. Review validation output:
   - `Contract` section (name, deployer, collection name when available)
   - `Tokens` section (token names and per-token errors)
   - `Verification Failed - Fix errors and revalidate` when validation fails
6. After `Verified`, use `Edit` to change inputs and revalidate.
7. Connect wallet if needed.
8. Confirm checklist eligibility:
   - contract deployer passes
   - non-deployer must meet the current runtime TDH threshold
9. Select `Add Rememe`, sign the message, and wait for submit status.
10. On success, use `view` links or `Add Another` to reload a fresh form.

## Status and Blocking States

- `Validate` stays disabled until contract, token IDs, and at least one Meme
  reference are present.
- `Add Rememe` stays disabled until all are true:
  - submission is `Verified`
  - wallet is connected
  - checklist has no failing item
- While signing, status shows `Signing Message`.
- While submitting, status shows `Adding Rememe`.
- Submit result shows `Status: Success` or `Status: Fail`.
- After success, `Add Rememe` stays disabled until reload (`Add Another`
  reloads the route).

## Edge Cases

- Range parsing rejects oversized spans (`start-end` where span is `>= 1000`,
  which is 1001+ token IDs).
- Validation can fail per token even when contract-level checks pass.
- Submission checklist can block when eligibility data is unavailable (for
  example missing threshold settings or missing TDH profile data).
- The requirements text section hardcodes `TDH > 6,942`, while runtime
  checklist eligibility uses current settings threshold.
- If the final add request fails before response handling, the route can stay
  in `Adding Rememe` state until refresh.

## Failure and Recovery

- Fix listed validation errors, then rerun `Validate`.
- If wallet signature is rejected, retry `Add Rememe` and sign again.
- If submit stays blocked, verify `Verified` state, wallet connection, and
  checklist status.
- If submission appears stuck on `Signing Message` or `Adding Rememe`, refresh
  `/rememes/add` and retry.
- After a successful submission, use `Add Another` (or refresh `/rememes/add`)
  before starting a new submission.

## Limitations / Notes

- Final acceptance is server-validated after signature submission.
- The flow depends on wallet connectivity and eligibility context.
- Non-deployer submissions depend on TDH lookup for the connected profile.
- Route state is not persisted after reload; `Add Another` performs a full page
  reload.
- `Edit` clears verified state and requires revalidation before signing again.

## Related Pages

- [Media Collections Index](README.md)
- [ReMemes Browse and Detail](feature-rememes-browse-and-detail.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
