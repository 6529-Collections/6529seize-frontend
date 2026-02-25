# Memes Submission Workflows

## Overview

The Memes submission flow is a three-step modal flow:

- Agreement.
- Artwork.
- Additional Information.

Artists can submit artwork by file upload or by referencing interactive media
through IPFS or Arweave. The submission flow validates required fields, shows
upload/signing/progress states, and only allows completion when all required
fields pass.

After submission, operational fields from Additional Information are rendered in the
single-drop view as process sections and an optional technical details block.

## Location in the Site

- Memes wave routes at `/waves/{waveId}` (leaderboard view).
- The submission modal is opened from the wave leaderboard `Drop` control.
- Additional Information results are visible from the Memes single-drop detail
  view.

## Entry Points

- Open a Memes wave leaderboard and start the drop flow from the `Drop` action.
- Follow the modal sequence:
  1. Agreement → Artwork → Additional Information.
- Open an existing Memes drop to inspect its process/technical sections.

## User Journey

1. Open a Memes wave leaderboard and start the modal from `Drop`.
2. Accept terms on the Agreement step.
3. In Artwork, choose one of two sources:
   1. **Upload File**: drag/drop or choose a supported local file.
   2. **Interactive HTML/GLB URL**: switch source tab, choose `IPFS` or
      `Arweave`, and enter a root hash/transaction ID.
4. If interactive media validates, the preview is shown.
5. Move to Additional Information and complete required operational inputs.
6. Open `Preview` to review the draft in full.
7. Submit and complete state progression:
   `uploading` → `processing` → `success`.
8. Open the single-drop view to inspect:
   - Process-related media, artist statement, and artwork commentary.
   - Optional collapsible technical details (distribution, payment, allowlist).

## Common Scenarios

- File upload mode:
  - Supported file flow supports local previews immediately after selection.
  - Upload and submit flow continues once artwork and trait fields are valid.
- Interactive source mode:
  - Gateway defaults and sanitization are user-friendly.
  - Validation blocks invalid hashes/unsafe URLs before submission.
- Additional Info: Airdrop Distribution:
  - One row is prefilled from the connected wallet when available, with `20`
    tokens.
  - Users can add/remove distribution rows.
  - Total is validated to equal `20` across all rows before submit.
- Additional Info: Payment config:
  - Payment address is required.
  - Optional designated payee toggles a name field.
- Additional Info: Allowlist config:
  - Users can add multiple batches.
  - Batch contract addresses are required per added batch.
  - Token ranges support formats like `1,2,3` and `10-20`.
- Additional Info: Supplemental media:
  - Supporting media accepts up to 4 items (images/videos).
  - Preview image is shown where required.
  - Promo media is optional and recommended for interactive/video submissions.
  - About Artist and Artwork Commentary are required text fields.
- After submission:
  - Drop detail view includes process fields and optional technical details when
    present.

## Edge Cases

- Switching input mode from upload to interactive does not discard local artwork until
  user explicitly clears URL mode.
- If interactive hash validation fails, the user stays on Artwork step until fixed.
- Switching back to upload restores previously prepared local state.
- Airdrop rules:
  - Count values must be integers and cannot exceed the `20` total target.
  - A row with positive count must have a valid `0x...` address.
  - Rows with addresses must not be invalid ENS names or malformed addresses.
- Allowlist rows:
  - Contract address is required when a batch exists.
  - Token IDs can be empty or in supported range/list format; invalid formats block
    submit.
- Preview requirements:
  - Preview image is required for media requiring visual preview.
  - `Submit Artwork` and `Preview` stay disabled until validation passes.
- Upload errors:
  - Failed supplemental uploads show inline upload-state errors and can be replaced.

## Failure and Recovery

- If no valid artwork exists (missing file and missing valid media URL), submission
  stops before API call.
- If media validation fails, inline errors explain which step must be fixed.
- If a field in Additional Information fails validation, the step blocks both
  `Preview` and `Submit Artwork` until corrected.
- If signing or API submission fails, users can retry from the same submission state.
- If you change only media extras and a file upload fails, remove/re-upload that
  item and continue once all required fields are valid.

## Limitations / Notes

- Interactive URL mode requires supported gateway hosts and root-style hashes.
- Interactive URLs block query strings, unsafe schemes, and path suffixes.
- Payment and distribution are fully user-editable in the submission modal.
- Technical details are displayed only when metadata contains:
  - Payment address
  - Airdrop allocation data
  - Allowlist configuration
- Process sections are only shown when the corresponding metadata exists.
- Supporting media upload is capped by UI limits:
  - `Supporting Media`: 4 files max
  - `Preview Image`: 1 file max
  - `Promo Video`: 1 file max

## Related Pages

- [Waves Index](../README.md)
- [Memes Index](../README.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
- [Docs Home](../../README.md)
