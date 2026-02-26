# Memes Additional Information Fields

## Overview

The Additional Information step captures operational fields used for memes drop
metadata and post-submission rendering.
When signed in, payment address and initial airdrop row are seeded from the
connected profile primary wallet.

## Location in the Site

- Memes submission modal Additional Information step
- Memes single-drop detail view where process/technical sections are rendered

## Entry Points

- Complete Agreement + Artwork steps and continue to Additional Information.
- Open existing memes single-drop view to inspect rendered process/technical fields.

## User Journey

1. Open Additional Information in submission modal.
2. Complete required artist + payment + distribution inputs.
3. Optionally configure allowlist and supplemental media.
4. Submit and open resulting drop to verify process/technical rendering.

## Common Scenarios

- Airdrop distribution starts with one prefilled wallet row totaling `20` tokens.
- Users can add/remove distribution rows.
- Total distribution must equal `20` before submission can pass.
- Payment address accepts `0x...` or ENS formats.
- Profile primary wallet preloads payment address and airdrop defaults.
- Enabling designated payee reveals required payee name and relabels address field.
- Allowlist supports multiple batches with required contract address per batch.
- Token ranges accept formats like `1,2,3` and `10-20`.
- `About the Artist` and `Artwork Commentary` are required.
- `About the Artist` auto-loads profile bio when available.
- Supporting media accepts up to 4 files.
- `Preview` media accepts one image/GIF and is required for video/HTML/GLB
  submissions.
- `Promo Video` accepts one video for HTML/GLB and is optional.

## Edge Cases

- Count values must be integers and cannot exceed total target `20`.
- Rows with positive count must have valid `0x...` addresses.
- Invalid ENS or malformed addresses block submission.
- Allowlist batch with missing contract address blocks submission.
- Invalid token ID range/list formats block submission.
- If profile has no bio, `About the Artist` starts empty and must be filled manually.

## Failure and Recovery

- Missing required payment/artist/commentary/preview fields keep submission blocked
  until corrected.
- If supplemental media upload fails, remove failed item, re-upload, and continue.

## Limitations / Notes

- Payment/distribution prefill is editable by the submitter.
- Technical details block in single-drop view appears only when metadata contains
  payment/distribution/allowlist details.
- Process sections appear only when corresponding metadata exists.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
