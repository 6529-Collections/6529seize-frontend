# Memes Submission Workflows

## Overview

The Memes submission flow is a three-step modal flow:

- Agreement.
- Artwork.
- Additional Information.

Artists can submit artwork by file upload or by referencing interactive media through
IPFS or Arweave. The submission flow validates required fields, shows upload,
signing, and progress states, and only allows completion when all required fields
pass.

After submission, operational fields from Additional Information are rendered in the
single-drop view as process sections (preview image, promo video, additional media,
about-artist text, and artwork commentary) plus an optional technical details block.
When signed in, payment address and the initial airdrop distribution row are seeded
from the connected profile’s primary wallet.

## Location in the Site

- Memes wave routes at `/waves/{waveId}` (leaderboard view).
- The submission modal is opened from the wave leaderboard `Drop` control.
- Additional Information results are visible from the Memes single-drop detail view.

## Entry Points

- Open a Memes wave leaderboard and start the modal from `Drop`.
- Follow the modal sequence:
  1. Agreement → Artwork → Additional Information.
- Open an existing Memes drop to inspect process and technical sections.

## User Journey

1. Open a Memes wave leaderboard and start the modal from `Drop`.
2. Accept terms on the Agreement step.
3. In Artwork, choose one of two sources:
   1. **Upload File**: drag/drop or choose a supported local file.
   2. **Interactive HTML/GLB URL**: switch source tab, choose `IPFS` or `Arweave`,
      and enter a root hash/transaction ID.
4. If interactive media validates, the preview is shown.
5. Move to Additional Information and complete required operational inputs.
6. Open `Preview` to review the draft in full.
7. Submit and complete state progression:
   `uploading` → `processing` → `success`.
8. Open the single-drop view to inspect:
   - Process sections for preview image, promo video (when provided), supporting
     media (shown as Additional Media), about-artist text, and artwork commentary.
   - Optional collapsible technical details (payment address with designated payee
     name when provided, distribution, allowlist).

## Common Scenarios

- File upload mode:
  - Supported file flow shows local previews immediately after selection.
- Supported formats are displayed in the upload area as: `PNG`, `JPG`, `GIF`,
    `VIDEO`, and `GLB`.
  - Files above `200MB` are rejected before upload and remain on the artwork
    step with an error state.
  - Upload progress remains within `0%` to `100%` during multipart retries so the
    progress overlay does not overflow.
  - Upload and submit flow continues once artwork and trait fields are valid.
- Interactive source mode:
  - Gateway defaults and sanitization are user-friendly.
  - Validation blocks invalid hashes/unsafe URLs before submission.
- Additional Info: Airdrop Distribution:
  - One distribution row is auto-prefilled from the connected wallet with a total of
    `20` tokens.
  - Users can add/remove distribution rows.
  - Total is validated to equal `20` across all rows before submit.
- Additional Info: Payment config:
  - Payment address is required and can be entered as `0x...` or ENS.
  - The connected profile primary wallet preloads the payment address.
  - When the payment address is preloaded from the connected profile, the
    designated payee toggle resets to off and the payee name field is cleared
    until you enable it.
  - Airdrop rows are also prefilled from the same wallet and are editable.
  - A designated payee toggle reveals a required payee name field and relabels the
    address as the designated payee address.
- Additional Info: Allowlist config:
  - Users can add multiple batches.
  - Contract addresses are required per added batch.
  - Token ranges support formats like `1,2,3` and `10-20`.
- Additional Info: Artist and story details:
  - `About the Artist` is required.
  - `Artwork Commentary` is required.
  - `About the Artist` is auto-loaded from the connected profile BIO when available.
- Additional Info: Supplemental media:
  - Supporting media accepts up to 4 items (images/videos).
  - `Preview` accepts one image or GIF and is required for video, HTML, and GLB
    submissions. It is used as the artwork thumbnail in leaderboard cards and
    sidebar leaderboard summaries.
  - `Promo Video` accepts one video for HTML/GLB submissions. It is optional; if it is
    omitted, the preview image is used for social sharing.
  - Process sections display the preview image, promo video (when provided),
    supporting media, about-artist text, and artwork commentary.

## Edge Cases

- Switching input mode from upload to interactive does not discard local artwork until
  user explicitly clears URL mode.
- If interactive hash validation fails, the user stays on the Artwork step until fixed.
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
  - Preview (image or GIF) is required for `video`, `text/html`, and
    `model/gltf-binary` submissions.
- Promo video:
  - The promo video option only appears for `text/html` and `model/gltf-binary`
    submissions.
- If the profile has no auto-populated BIO, `About the Artist` starts empty and must be
  filled manually.

## Failure and Recovery

- If no valid artwork exists (missing file and missing valid media URL), submission
  stops before API call.
- If media validation fails, inline errors explain which step must be fixed.
- If the selected artwork file is empty, upload fails with a validation error and
  users must re-select a valid file before submit.
- If the selected artwork format is not supported (for example unsupported MIME type),
  validation errors remain visible on the upload step and you must choose a supported
  file type.
- If required fields in Additional Information fail validation, `Preview` and `Submit
  Artwork` stay disabled until corrected.
- If signing or API submission fails, users can retry from the same submission state.
- If a required field remains missing (payment, artist text, commentary, or preview
  image), users must correct it before submission can continue.
- If a supplemental upload fails, remove and re-upload the failed file and continue
  after all required fields are valid.

## Limitations / Notes

- Interactive URL mode requires supported gateway hosts and root-style hashes.
- Interactive URLs block query strings, unsafe schemes, and path suffixes.
- Payment and distribution are prefilled from profile wallet data when present, but are
  user-editable.
- Technical details are displayed only when metadata contains:
  - Payment address
  - Airdrop allocation data
  - Allowlist configuration
- Process sections are only shown when the corresponding metadata exists.
- Supporting media upload is capped by UI limits:
  - `Supporting Media`: 4 files max
  - `Preview`: 1 file max
  - `Promo Video`: 1 file max

## Related Pages

- [Waves Index](../README.md)
- [Memes Index](../README.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
- [Docs Home](../../README.md)
