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
  - Desktop memes tabs header (non-compact header mode only):
    `Submit Work to The Memes`
    - urgent windows can relabel this to `Submit Meme` or
      `Submit Meme (Closes Soon!)`
    - narrower desktop widths can show compact labels (for example
      `Submit Work`)
  - Native app wave header: icon-only submit action
    - when submission is blocked, the action becomes a lock; select it to see
      the exact restriction
  - Mobile leaderboard header: `Drop`
  - Mobile chat thread: floating `+` button (top-right)

If submission is unavailable (not started, closed, not eligible, or limit
reached), select the header restriction control to see the reason, then use
[Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md).

## Entry Points

- Open a memes wave at `/waves/{waveId}`.
- Start from any available submit control:
  - desktop memes header action (`Submit Work to The Memes`; urgent windows can
    relabel this to `Submit Meme` or `Submit Meme (Closes Soon!)`)
  - mobile leaderboard header action (`Drop`)
  - mobile chat floating submit button (`+`, top-right)
- If submission controls are hidden or show a restriction icon/label, select
  the restriction control for the full reason and use
  [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
  for the gating states.
- On The Memes Main Stage, the desktop `How to Submit` state and the native app
  lock both open `Unlock submissions`, with live MemesNominee REP progress and
  a `Get nominated` action.

## User Journey

1. Open the memes submit modal from an available submit control.
3. In `Agreement`, review terms, check the certification box, and click
   `I Agree & Continue`.
4. In `Artwork`, complete the required metadata fields:
   - `Artwork Details` (`Artwork Title`, `Description`)
   - all required trait fields grouped under sections such as
     `Basic Information`, `Card Points`, and `Card Attributes`
5. Choose one media source:
   - `Upload File`: drag/drop or use the file picker, review the grouped format
     badges in the drop zone, then preview the selected artwork.
   - `Interactive HTML`: switch to `Interactive HTML`, pick `IPFS` or
     `Arweave` from the `Hosting Network` tabs, enter the root
     CID/transaction ID in `Content Hash or Path` (or paste an approved
     gateway URL), review the resulting URL, and wait for validation.
6. Click `Continue` to open `Additional Information`.

## Common Scenarios

- `I Agree & Continue` stays disabled until the agreement checkbox is checked.
- Required fields in `Artwork` show visible `*` markers.
- Filled text and select fields show success styling, including a green ring and
  checkmark, until a validation error replaces that state.
- On larger viewports, `Artwork` keeps the media source panel and the metadata
  form side by side while the form scrolls independently. On smaller
  viewports, the same content stacks and scrolls as one page.
- On touch devices, focusing a text field scrolls it into the visible part of
  the modal after the software keyboard opens. In the native app, the modal
  also reduces its height so the keyboard does not cover the action bar.
- The upload drop zone shows grouped format badges for image, video, and
  interactive model uploads before a file is selected.
- After a file is selected, the preview surface keeps a `Change` control for
  clearing the current upload and picking another file.
- The interactive artwork panel always shows `Media Type` as `Interactive HTML
  (text/html)` while the provider selector switches between `IPFS` and
  `Arweave`.
- `Artwork` `Continue` remains available before required fields are complete.
  Selecting it validates the media and all required metadata together.
- While an interactive artwork hash is being verified, `Continue` stays
  disabled until that check finishes.
- Numeric trait fields reject `0`.
- Upload checks:
  - accepted formats include `PNG`, `JPG/JPEG`, `GIF`, `MP4/MOV`, and
    `GLB/GLTF`
  - files above `200MB` are rejected
- Switching between `Upload File` and `Interactive HTML` keeps each source
  draft for the current modal session.

## Edge Cases

- Pasting `ipfs://...`, `https://ipfs.io/ipfs/...`, or
  approved Arweave gateway URLs such as `https://arweave.net/...`,
  `https://ardrive.net/...`, `https://gateway.arweave.net/...`, or
  `https://gateway.ar.io/...` is normalized down to the root content
  identifier before validation.
- Despite the `Content Hash or Path` label, interactive embeds currently accept
  only root identifiers. Subpaths, query strings, and fragments are rejected.
- Interactive HTML checks:
  - content must stay on approved IPFS or Arweave gateways
  - approved Arweave gateways include `arweave.net`, `ardrive.net`,
    `gateway.arweave.net`, `gateway.ar.io`, and valid
    `*.arweave.net` transaction subdomains
  - content must resolve to an HTML response
- The pre-filled `Seize Artist Profile` field remains read-only and does not
  block `Continue`.

## Failure and Recovery

- Unsupported type or oversized upload shows inline validation errors in
  `Artwork`.
- Selecting `Continue` with missing or invalid values gives every affected
  field red error styling and an inline recovery message.
- If artwork is missing, the upload area or interactive hash input turns red.
- Changing between `Upload File` and `Interactive HTML` clears the previous
  generic missing-media error until `Continue` is selected again; specific
  file or hash validation errors remain visible.
- Invalid or unreachable interactive content shows inline errors; fix input and
  retry.
- If a pasted gateway URL is rejected, replace it with the root CID/transaction
  ID or retry with an approved gateway URL for the same asset.
- After an invalid `Continue` attempt, focus and scrolling move to the first
  missing item in form order: media first, then title, description, and traits.
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
