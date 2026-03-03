# Memes Additional Information Fields

## Overview

The `Additional Information` step captures payout/distribution metadata and
creator context shown on memes single-drop views.

When available, the connected profile's primary wallet seeds both:

- `Payment Address`
- initial `Airdrop Distribution` row (`20` total count)

## Location in the Site

- Memes submission modal: `Additional Information` step
- Memes single-drop detail view:
  - `Technical details` accordion
  - additional content sections (`Preview Image`, `Promo Video`,
    `Additional Media`, `About the Artist`, `Artwork Commentary`)

## Entry Points

- Complete `Agreement` and `Artwork`, then continue to `Additional Information`.
- Open a submitted memes drop to review rendered metadata sections.

## User Journey

1. Review/edit `Airdrop Distribution`.
2. Review/edit `Payment`, optionally enabling `Designated Payee`.
3. Add optional `Allowlist Configuration` batches.
4. Add optional media and required text under `Supplemental Media & Commentary`.
5. Continue to `Preview` and submit.
6. Open the resulting drop to verify rendered technical/detail sections.

## Common Scenarios

- Airdrop totals must equal `20` before `Preview`/`Submit Artwork` is enabled.
- Users can add/remove airdrop rows and allowlist batches.
- Address inputs accept ENS input, but submission requires resolved strict `0x`
  addresses.
- Enabling `Designated Payee` makes payee name required and relabels address
  field.
- Allowlist batches require contract address; token IDs are optional.
- Token IDs support formats like `1,2,3` and `10-20`.
- `About the Artist` and `Artwork Commentary` are required.
- `About the Artist` auto-loads profile bio when available.
- Supporting media allows up to `4` uploads.
- `Preview` image is required for `Video`, `HTML`, and `GLB` submissions.
- `Promo Video` is optional and shown for `HTML`/`GLB` submissions.

## Edge Cases

- Airdrop counts must be non-negative integers.
- Any row with `count > 0` needs a valid address.
- Valid addresses with `count <= 0` also block submit.
- Invalid ENS resolution or malformed addresses block submit.
- Invalid token ID range/list formats block submit.
- If profile bio is unavailable, `About the Artist` starts empty.

## Failure and Recovery

- Missing payment/address/commentary/artist/preview requirements keep actions
  disabled until fixed.
- Failed supplemental uploads can be removed and retried.
- If a stored drop has malformed additional-media JSON, only valid parsed
  fields render.

## Limitations / Notes

- Prefilled payment/airdrop values remain editable.
- `Technical details` appears only when payment, airdrop, or allowlist metadata
  exists.
- Detail sections render only when their metadata fields are present.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
