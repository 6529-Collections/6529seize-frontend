# ReMemes Add Submission

## Overview

`/rememes/add` is a signed submission flow:
validate contract/token inputs, confirm eligibility, sign, and submit.

## Location in the Site

- ReMeme add route: `/rememes/add`

## Entry Points

- Open `/rememes/add` directly.
- From `/rememes`, select `Add ReMeme`.

## User Journey

1. Open `/rememes/add`.
2. Enter `Contract` and `Token IDs`:
   - comma list: `1,2,3`
   - range: `1-3`
   - mixed: `1-3,5`
3. Add one or more `Meme References`.
4. Select `Validate`.
5. Review verification output:
   - contract metadata
   - token checks and token-level errors
   - `Verification Failed` rows when validation fails
6. After `Verified`, connect wallet (if needed).
7. Confirm checklist eligibility (contract deployer or TDH threshold pass).
8. Select `Add Rememe`, sign the message, and wait for submission result.
9. On success, use `view` links or `Add Another` to reload the form.

## Common Scenarios

- Add a single token with one Meme reference.
- Add a short token range with multiple Meme references.
- Validate first, then switch to `Edit` before signing.

## Edge Cases

- `Validate` stays disabled until contract, token IDs, and at least one Meme
  reference are present.
- Range parsing rejects large spans (`start-end` where span is `>= 1000`).
- Validation can fail per token even when contract-level checks pass.
- Submission checklist can block when eligibility data is unavailable (for
  example missing threshold settings or missing TDH profile data).
- The requirements text section hardcodes `TDH > 6,942`, while runtime
  checklist eligibility uses current settings threshold.
- If the final add request fails before response handling, the route can stay
  in submitting state until refresh.

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
- The flow depends on wallet connectivity and user eligibility context.
- Route state is not persisted after reload; `Add Another` performs a full page
  reload.
- `Add Rememe` stays disabled after a successful submission until the page is
  reloaded.

## Related Pages

- [Media Collections Index](README.md)
- [ReMemes Browse and Detail](feature-rememes-browse-and-detail.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
