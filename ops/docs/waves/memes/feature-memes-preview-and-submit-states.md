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
4. Confirm the submitting profile's avatar and handle in the compact footer.
   The authenticated profile stays visible even when its wallet is disconnected.
5. If the wallet is disconnected, click `Connect Wallet`. Connecting never
   starts submission automatically.
6. After the connected profile is shown and confirmed as eligible, click
   `Submit Artwork`.
7. The primary action reports upload progress, asks the user to check the
   wallet while signing, and stays disabled through API processing.
8. On `success`, the modal closes after a short delay.

## Common Scenarios

- `Preview` is optional; direct submit from `Additional Information` is
  supported.
- Both finish paths show the authenticated submitting profile on the left and
  grouped action buttons on the right in one desktop footer row. On smaller
  screens, the buttons sit below the identity and can wrap when needed. There is
  no visible `Submitting as` label, wallet address, or wallet-provider name.
  The avatar and handle are vertically centered. Back actions use a quiet text
  style while retaining their full button tap area; `Preview` remains outlined
  and the primary action remains filled.
- The avatar's amber dot means that profile's wallet is not connected; green means
  it is connected. Hover, focus, or tap the avatar for `Connect a wallet to submit` or
  `Wallet connected`; press `Escape` or move focus away to dismiss the tooltip.
- Normal eligibility is not labeled. Eligibility checks, errors, and blocking
  explanations remain visible. An eligible profile still needs its wallet
  connected before submitting.
- Connecting a different wallet does not by itself change the active submitting
  profile. If A remains active while B's wallet is connected, the strip still
  shows A with an amber dot. Explicitly switching profiles updates the strip and
  uses that profile's eligibility result.
- A disconnected wallet shows `Connect Wallet` instead of `Submit Artwork`.
- If a different profile is connected while the modal is open, the current
  draft remains in place while eligibility is checked again for that profile.
- An ineligible connected profile remains visible with an explanation and a
  `Switch Wallet` action; it cannot submit.
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
- A synchronous submission lock prevents repeated clicks from starting a
  second upload or signature request, including clicks before the first React
  loading-state render.
- The signing profile and auth session are checked again after media upload and
  before the signed request is posted. A wallet change stops the attempt and
  keeps the draft for retry.
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
- Errors are surfaced via toast. The primary action returns to an enabled retry
  state after upload, authentication, signing, or API failures.
- If no valid media exists, submission is blocked before API post.

## Limitations / Notes

- Preview is local draft rendering only; it does not guarantee final ranking or
  on-chain outcomes.
- `success` only confirms app-level submit completion; downstream processing is
  outside this modal.
- Localization fallback debt: the Memes submission identity, action, preview,
  and shell messages currently use the `en-US` source copy for `en-GB`, `fr-FR`,
  `es-ES`, and `de-DE`. The frontend localization owners should add partial
  dictionaries when this submission surface reaches the next locale rollout.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
