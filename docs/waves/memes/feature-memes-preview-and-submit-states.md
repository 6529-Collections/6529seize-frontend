# Memes Preview and Submit States

## Overview

Before final submit, memes modal provides a read-only preview mode that renders
leaderboard and gallery card variants.
Submission progresses through `uploading` -> `processing` -> `success` and keeps
users in the same modal flow when retry is needed.

## Location in the Site

- Memes submission modal preview screen
- Memes leaderboard/gallery cards after successful submission

## Entry Points

- Complete required Additional Information fields.
- Click `Preview` from Additional Information.
- Click `Back to Edit` or `Submit Artwork` from preview.

## User Journey

1. Fill required fields in Additional Information.
2. Click `Preview` to open read-only draft render.
3. Review leaderboard and gallery card appearance.
4. Use `Back to Edit` to continue editing with draft state preserved.
5. Use `Submit Artwork` to begin upload/signing/submission progression.
6. On success, verify rendered sections in resulting memes drop detail view.

## Common Scenarios

- `Preview` action appears only after required fields validate.
- Preview cards are non-actionable and intended only for layout verification.
- Preview uses temporary score/rating values to mimic live leaderboard appearance.
- Returning from preview preserves current draft values.
- Post-submit single-drop view can render process sections for preview image,
  promo video, additional media, about-artist text, and commentary.

## Edge Cases

- Preview media is required for `video`, `text/html`, and `model/gltf-binary`
  submissions.
- Promo video option appears only for `text/html` and `model/gltf-binary`
  submissions.
- Very small viewports keep content scrollable while retaining action controls.

## Failure and Recovery

- If Additional Information validation fails, `Preview` and `Submit Artwork` remain
  disabled.
- If preview output looks incorrect, return to edit, adjust fields, and reopen
  preview.
- If signing/API submission fails, users can retry from existing modal state.

## Limitations / Notes

- Preview is a local draft render and does not imply final ranking/on-chain outcome.
- Social-share fallback uses preview image when promo video is not provided.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
