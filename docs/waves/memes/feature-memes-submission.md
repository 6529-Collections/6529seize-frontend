# Memes Submission Workflow

## Overview

Memes submission uses a three-step modal workflow:

- Agreement
- Artwork
- Additional Information

Artists can submit by file upload or by referencing interactive media via IPFS or
Arweave.
The modal enforces required fields and only enables completion when inputs are valid.

## Location in the Site

- Memes wave route: `/waves/{waveId}` (leaderboard view)
- Submission modal opened from leaderboard `Drop` control

## Entry Points

- Open a Memes wave leaderboard and click `Drop`.
- Progress through Agreement -> Artwork -> Additional Information.

## User Journey

1. Start the modal from Memes leaderboard `Drop`.
2. Accept terms in Agreement step.
3. In Artwork, choose source type:
   - **Upload File**: drag/drop or select supported local file.
   - **Interactive URL**: choose `IPFS` or `Arweave` and enter root hash or tx ID.
4. If interactive input validates, artwork preview appears.
5. Continue to Additional Information and complete required fields.
6. Move to preview/submission states once validation passes.

## Common Scenarios

- Upload mode shows local previews after file selection.
- Supported upload labels are `PNG`, `JPG`, `GIF`, `VIDEO`, and `GLB`.
- Files larger than `200MB` are rejected before upload.
- Upload progress stays within `0%` to `100%` during multipart retries.
- Interactive mode sanitizes gateway input and blocks invalid hashes/unsafe URLs.
- On small screens, modal stays within viewport and artwork step scrolls internally.
- Upload and interactive panels keep minimum heights on small screens to avoid
  collapsing controls.

## Edge Cases

- Switching from upload to interactive mode does not discard prepared local artwork
  until URL mode is explicitly cleared.
- Switching back to upload restores previously prepared local upload state.
- If interactive hash validation fails, users remain on Artwork step until corrected.

## Failure and Recovery

- If no valid artwork exists (missing file and missing valid media URL), submission
  stops before API call.
- Empty selected files fail validation and require reselection.
- Unsupported file formats keep validation errors visible on Artwork step.
- If signing or submission fails, users can retry from the same modal state.

## Limitations / Notes

- Interactive URL mode requires supported gateway hosts and root-style hashes.
- Interactive URLs block query strings, unsafe schemes, and path suffixes.

## Related Pages

- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
