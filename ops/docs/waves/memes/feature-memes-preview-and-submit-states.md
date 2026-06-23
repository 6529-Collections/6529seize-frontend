# Memes Preview and Submit States

## Overview

`Additional Information` has two finish paths:

- open `Preview`, then submit
- submit directly from `Additional Information`

`Preview` is read-only. It shows how your draft can appear in leaderboard list
and gallery cards.

Submit phases:

- file submit: `uploading -> signing -> processing -> success` (or `error`)
- interactive URL submit: `signing -> processing -> success` (or `error`)

On `success`, the modal auto-closes after a short delay.

## Location in the Site

- Memes wave route: `/waves/{waveId}`
  - submission modal `Additional Information` action row (`Back`, `Preview`,
    `Submit Artwork`)
  - submission modal preview screen (`Submission Preview`)

## Entry Points

- Complete `Agreement` and `Artwork`.
- Fill required `Additional Information` inputs.
- Choose `Preview` or `Submit Artwork`.

## User Journey

1. Complete required `Additional Information` fields.
2. Choose a finish path:
   - click `Preview`, then review and submit
   - click `Submit Artwork` directly
3. If you open preview, review both card layouts and use `Back to Edit` if
   needed.
4. Click `Submit Artwork`.
5. While submit is running, action buttons show loading and block repeated
   clicks.
6. On `success`, the modal closes after a short delay.

## Common Scenarios

- `Preview` is optional; direct submit from `Additional Information` is
  supported.
- `Preview` stays disabled until `Additional Information` is valid.
- `Submit Artwork` from `Additional Information` stays disabled until the form
  is valid.
- `Preview` and `Submit Artwork` also stay disabled if any `Additional Information`
  metadata value exceeds `5000` characters.
- `Back to Edit` returns to the same draft values.
- Preview uses temporary drop values (ID/score/rater data) for layout checks.
- Main preview-card click handlers are inert, so card-body clicks do not open a
  drop.

## Edge Cases

- Interactive URL submissions skip upload and start at `signing`.
- File submissions include `uploading` before signing/processing.
- Preview image requirements for `Video`/`HTML`/`GLB` must pass before preview
  or submit actions enable.
- `Back` (`Additional Information`) and `Back to Edit` (`Preview`) are disabled
  while a submission request is in flight.
- Top-level close controls (close icon, backdrop click, `Escape`) remain
  available while submission is in flight.
- Small viewports keep preview content scrollable with fixed action controls.

## Failure and Recovery

- If preview output is wrong, return to edit, update fields, and reopen preview.
- If metadata goes over `5000` characters, trim the affected
  `Additional Information` content and retry before reopening preview or
  submitting.
- If upload, auth, signing, or API submission fails, the modal keeps current
  draft state and supports retry from the current screen.
- If submission is attempted with an over-limit metadata payload, the app stops
  before upload/signing and can show a toast naming the offending metadata
  sections.
- Errors are surfaced via toast; `Additional Information` and `Preview` do not
  show detailed per-phase text labels.
- If no valid media exists, submission is blocked before API post.

## Limitations / Notes

- Preview is local draft rendering only; it does not guarantee final ranking or
  on-chain outcomes.
- `success` only confirms app-level submit completion; downstream processing is
  outside this modal.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
