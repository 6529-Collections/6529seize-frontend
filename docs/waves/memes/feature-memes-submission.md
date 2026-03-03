# Memes Submission Workflow

## Overview

Memes submission uses a three-step modal:

- `Agreement`
- `Artwork`
- `Additional Information`

Creators can submit by uploading a file or by referencing interactive HTML from
IPFS/Arweave. The modal blocks forward progress until required inputs are valid.

## Location in the Site

- Memes wave thread route: `/waves/{waveId}`
- Memes submission modal start controls:
  - Desktop meme tabs header: `Submit Work to The Memes`
  - Mobile leaderboard header: `Drop`
  - Mobile chat view: floating submit button

## Entry Points

- Open a memes wave where submit is enabled.
- Start submission from any submit control.
- In `Agreement`, check the certification box and click `I Agree & Continue`.

## User Journey

1. Open the modal and accept terms in `Agreement`.
2. In `Artwork`, complete `Artwork Details` (`Title`, `Description`) and trait
   fields.
3. Choose media source:
   - `Upload File`: drag/drop or file picker.
   - `Interactive HTML`: choose `IPFS` or `Arweave`, then enter root CID/tx ID.
4. Continue to `Additional Information` after Artwork validation passes.
5. Continue to preview and submit states from Additional Information.

## Common Scenarios

- Upload mode supports `PNG`, `JPG`, `GIF`, `VIDEO`, and `GLB` categories.
- Uploads above `200MB` are blocked before submit.
- Interactive mode accepts only root identifiers (no path/query/fragment
  suffixes).
- Interactive preview validation checks allowed HTTPS gateways and HTML content
  type.
- Switching between `Upload File` and `Interactive HTML` keeps each source's
  draft state.
- `Escape`, backdrop click, and close button close the modal.

## Edge Cases

- `Agreement` cannot continue until certification is checked.
- `Artwork` cannot continue until required text/trait fields and media are
  valid.
- Number-based trait fields reject `0`.
- Interactive validation pending/invalid states keep users on `Artwork` until
  corrected.

## Failure and Recovery

- Unsupported file type or oversize file shows validation errors in `Artwork`.
- If no valid media source exists, submit is blocked before API call.
- Interactive validation failures show inline errors; fix hash/provider and
  retry.
- Signing/API failures keep modal state; users can retry without restarting.

## Limitations / Notes

- Interactive mode is fixed to `text/html` media type.
- Final submit requires wallet authentication and signature against wave terms.
- Entry gating (eligibility, limits, open/close windows) is documented in
  [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md).

## Related Pages

- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
