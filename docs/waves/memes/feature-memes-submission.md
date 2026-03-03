# Memes Submission Workflow

## Overview

This page covers the start of memes submission:

- `Agreement`
- `Artwork`

After `Artwork`, users move to `Additional Information`. Preview and final
submit states are documented separately.

## Location in the Site

- Memes wave thread route: `/waves/{waveId}`
- Submit controls that open this modal:
  - Desktop memes tabs header: `Submit Work to The Memes`
    - urgent windows can relabel this to `Submit Meme` or
      `Submit Meme (Closes Soon!)`
  - Mobile leaderboard header: `Drop`
  - Mobile chat thread: floating `+` button (top-right)

If submit controls are unavailable (not started, closed, not eligible, or limit
reached), use
[Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md).

## User Journey

1. Open a memes wave at `/waves/{waveId}`.
2. Start from a submit control.
3. In `Agreement`, review terms, check the certification box, and click
   `I Agree & Continue`.
4. In `Artwork`, complete:
   - `Artwork Details` (`Artwork Title`, `Description`)
   - all required trait fields
5. Choose one media source:
   - `Upload File`: drag/drop or file picker, then preview/remove/replace.
   - `Interactive HTML`: choose `IPFS` or `Arweave`, enter a root
     CID/transaction ID, and wait for validation.
6. Click `Continue` to open `Additional Information`.

## Validation and Gating

- `I Agree & Continue` stays disabled until the agreement checkbox is checked.
- `Artwork` `Continue` stays disabled until required traits and media checks
  pass.
- Numeric trait fields reject `0`.
- Upload checks:
  - accepted formats include `PNG`, `JPG/JPEG`, `GIF`, `MP4/MOV`, and
    `GLB/GLTF`
  - files above `200MB` are rejected
- Interactive HTML checks:
  - only root identifiers are accepted (no subpaths, query strings, or
    fragments)
  - content must stay on trusted gateways (`ipfs.io`, `arweave.net`)
  - content must resolve to an HTML response
- Switching between `Upload File` and `Interactive HTML` keeps each source
  draft for the current modal session.

## Failure and Recovery

- Unsupported type or oversized upload shows inline validation errors in
  `Artwork`.
- Invalid or unreachable interactive content shows inline errors; fix input and
  retry.
- `Close` icon, backdrop click, `Cancel`, or `Escape` closes the modal from any
  step.
- Closing the modal discards the draft. Reopening starts a new draft.

## Limitations / Notes

- Interactive mode is fixed to `text/html`.
- `Additional Information`, preview, and submit phases are documented in
  dedicated pages.

## Related Pages

- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)
