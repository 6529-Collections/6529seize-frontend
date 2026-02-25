# Memes Submission Workflows

## Overview

The Memes submission flow lets eligible users post new drops to a Memes wave
from a compact modal. The workflow supports two artwork input modes:

- Upload a local media file.
- Reference a hosted interactive HTML experience using an IPFS or Arweave hash.

In both modes, the flow validates required fields, shows progress during upload
and signature, and only submits when the user has completed required artwork,
trait, and additional info steps.

## Location in the Site

- Memes wave routes at `/waves/{waveId}` (leaderboard view).
- The submission modal is opened from the wave leaderboard header `Drop` control.

## Entry Points

- Open a Memes wave in the `waves` section and switch to the leaderboard view.
- Select `Drop`.
- Complete the modal sequence from Agreement → Artwork → Additional Info.

## User Journey

1. Open a Memes wave leaderboard and start the modal from `Drop`.
2. Accept terms on the Agreement step.
3. In Artwork, choose one of two sources:
   1. **Upload File**: drag and drop or browse for a supported file.
   2. **Interactive HTML**: switch to the second tab and provide a gateway hash.
4. For interactive HTML, pick `IPFS` or `Arweave`, then enter a hash.
5. If validation succeeds, the submission shows a secure preview.
6. Move to Additional Info and add required metadata (airdrop splits,
   recipient/payment details, commentary, and artist statement).
7. Use `Preview` to review list and gallery rendering of the draft drop.
8. Submit and confirm final state:
   `uploading` → `processing` → `success`.

## Common Scenarios

- File upload mode:
  - Users can submit images, videos, and interactive media formats accepted by the
    uploader.
  - The artwork area updates immediately with a local preview.
- Interactive HTML mode:
  - Host choice defaults to IPFS and accepts root CIDs and Arweave transaction IDs.
  - Validation displays `Validating preview...` while checking the gateway.
  - After validation, the interactive preview is shown in a secure embedded frame.
- Additional info mode for interactive media:
  - `Preview image` is required for video and HTML submissions.
  - `Promo video` is optional and recommended for social sharing.
- Submission completion:
  - Progress state appears while upload/signing/process completes.
  - The modal stays open for retry or correction after failure states.

## Edge Cases

- Switching from `Upload` to `Interactive HTML` does not discard the uploaded file
  until you clear the URL mode explicitly.
- Switching back to `Upload` restores the previously prepared local upload state.
- Unsupported browsers can still open the flow, and unsupported-browser notices are
  shown inline for media upload readiness.
- If HTML/CID validation fails, the interactive tab shows why the hash is
  rejected before submission can continue.
- Interactive HTML validation blocks unsafe inputs during editing, including query
  strings, fragments, credentials, non-HTTPS URLs, non-root paths, and unsupported
  hosts.

## Failure and Recovery

- If no valid artwork exists (no file and no valid URL), the submit action does not
  proceed.
- If the interactive hash is invalid or not resolvable to an HTML document, the
  flow keeps the user on the Artwork step and surfaces the validation error.
- If artwork upload fails, users can retry using retry UI in the upload panel.
- If request signing or submission fails, the modal shows an error state and users
  can fix inputs and retry.

## Limitations / Notes

- Interactive URL mode requires a gateway host from a limited allowlist
  (`ipfs.io` and `arweave.net`) and a root hash/transaction identifier.
- Interactive sources do not permit query strings, subpaths, or spaces.
- Interactive HTML preview depends on the selected hosting gateway and can take
  a moment before appearing.

## Related Pages

- [Waves Index](../README.md)
- [Memes Index](../README.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
- [Docs Home](../../README.md)
