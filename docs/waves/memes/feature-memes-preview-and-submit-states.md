# Memes Preview and Submit States

## Overview

Before final submit, the memes modal provides a read-only preview screen with
leaderboard list and gallery render cases.

Submission phase flow is:

- file submit: `uploading -> signing -> processing -> success`
- interactive URL submit: `signing -> processing -> success`

Errors keep the user in the same modal state for retry.

## Location in the Site

- Memes submission modal preview screen (inside `Additional Information`)
- Memes single-drop view after successful submit

## Entry Points

- Complete required `Additional Information` fields.
- Click `Preview`.
- From preview, click `Back to Edit` or `Submit Artwork`.

## User Journey

1. Click `Preview` to open read-only rendering.
2. Review list and gallery card appearance.
3. Use `Back to Edit` to keep editing with draft state preserved.
4. Click `Submit Artwork` to run submit phases.
5. Wait for `success`; modal closes shortly after success.
6. Open resulting drop and verify rendered details.

## Common Scenarios

- `Preview` and `Submit Artwork` stay disabled until Additional Information is
  valid.
- Preview cards are non-actionable and used only for layout/content checks.
- Preview uses temporary rating/rank values to simulate leaderboard appearance.
- `Back to Edit` returns to the same draft values.
- Submission progress UI reports `uploading`, `signing`, `processing`,
  `success`, or `error`.
- In `Artwork`, submit button text changes by phase (`Continue`,
  `Uploading...`, `Processing...`, `Try Again`, `✓ Submission Complete`).

## Edge Cases

- Interactive URL submissions skip upload and start at `signing`.
- `Cancel` in `Artwork` is disabled while uploading/processing.
- Preview image requirements for `Video`/`HTML`/`GLB` must pass before preview
  or submit actions enable.
- Small viewports keep preview content scrollable with fixed action controls.

## Failure and Recovery

- If preview output is wrong, return to edit, update fields, and reopen preview.
- If authentication/signing/API submission fails, the modal keeps current draft
  state and supports retry.
- If no valid media exists, submission is blocked before API post.

## Limitations / Notes

- Preview is local draft rendering only; it does not guarantee final ranking or
  on-chain outcomes.
- `success` confirms submission completion in app flow; downstream processing
  outside this modal is out of scope.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
