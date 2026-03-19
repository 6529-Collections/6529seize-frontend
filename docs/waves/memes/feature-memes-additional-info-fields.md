# Memes Additional Information Fields

## Overview

The `Additional Information` step captures payout/distribution metadata and
creator context for a memes submission.

After submit, the same metadata is shown on the memes single-drop view.

If the connected profile has a primary wallet, the form pre-fills:

- `Payment Address`
- the initial `Airdrop Distribution` row (`20`)

## Location in the Site

- Memes wave route: `/waves/{waveId}`
  - submission modal `Additional Information` step
- Memes single-drop route: `/waves/{waveId}?drop={dropId}`
  - `Technical details` accordion
  - additional content sections (`Preview Image`, `Promo Video`,
    `Additional Media`, `About the Artist`, `Artwork Commentary`)

## Entry Points

- Start from memes submit controls:
  - desktop memes header action (`Submit Work to The Memes`; urgent states can
    show `Submit Meme`)
  - mobile leaderboard header action (`Drop`)
  - mobile chat floating submit button (`+`, top-right)
- Complete `Agreement` and `Artwork`, then open `Additional Information`.
- Open a submitted memes single-drop view to review rendered metadata sections.

## User Journey

1. Review/edit `Airdrop Distribution`.
2. Review/edit `Payment`, optionally enabling `Designated Payee`.
3. Add optional `Allowlist Configuration` batches.
4. Add optional media and required text under `Supplemental Media & Commentary`.
5. Continue to `Preview` and submit.
6. Open the resulting drop to verify rendered technical/detail sections.

## Common Scenarios

- Airdrop totals must equal `20` before `Preview`/`Submit Artwork` is enabled.
- Adding an airdrop row pre-fills its count with remaining allocation.
- The last airdrop row cannot be removed.
- Address inputs accept ENS input, but submission requires resolved strict `0x`
  addresses.
- Enabling `Designated Payee` relabels the address input to
  `Designated Payee Address *`.
- Allowlist batches can be added/removed.
- Every allowlist batch requires a strict `0x` contract address;
  `Token IDs` is optional.
- Token IDs support values like `1`, `1,2,3`, and `10-20`.
- `About the Artist` and `Artwork Commentary` are required.
- `About the Artist` auto-loads profile bio when available.
- `Supporting Media` accepts image/video uploads, up to `4` files.
- `Preview` upload is required for `Video`, `HTML`, and `GLB` submissions
  (`image/*`, including GIF).
- `Promo Video` upload is optional and appears for `HTML`/`GLB` submissions.
- Near-limit metadata counters appear once a stored value reaches
  `4500/5000` characters.
- Counters can surface for `Airdrop Distribution`, `Payment`,
  `Allowlist Configuration`, `Supporting Media`, `About the Artist`, and
  `Artwork Commentary`.

## Validation and Gating

- `Preview` and `Submit Artwork` stay disabled until all required checks pass.
- Airdrop checks:
  - each count must be a non-negative integer
  - total must equal `20`
  - any `count > 0` row must have a valid strict address
  - any valid address row must have `count > 0`
  - malformed/unresolved addresses block progress
- Payment checks:
  - payment address is required
  - payment address must resolve to a strict `0x` address
- Allowlist checks:
  - each batch contract must be a strict `0x` address
  - token ID text must match supported list/range formats
- Required text checks:
  - `About the Artist` must be non-empty
  - `Artwork Commentary` must be non-empty
- Metadata size checks:
  - each stored metadata value must stay at or below `5000` characters
  - `About the Artist` and `Artwork Commentary` show inline over-limit errors
  - any over-limit metadata value blocks `Preview` and `Submit Artwork`
- Media checks:
  - required `Preview` upload must exist for `Video`/`HTML`/`GLB`

## Edge Cases

- `Designated Payee Name *` shows an inline required error when blank.
- Current submit gating does not block on an empty designated payee name.
- Invalid token ranges like reversed ranges (`20-10`) block progress.
- If profile bio is unavailable, `About the Artist` starts empty.

## Single-Drop Rendering

- `Technical details` renders only when parsed metadata contains at least one of:
  - payment address
  - valid airdrop entries (`count > 0`)
  - allowlist batches with contract address
- `Technical details` includes copy actions for payment/airdrop/allowlist
  addresses.
- `Preview Image`, `Promo Video`, `Additional Media`, `About the Artist`, and
  `Artwork Commentary` each render only when data exists.
- `Additional Media` shows at most `4` items.

## Failure and Recovery

- Missing required fields keep `Preview` and `Submit Artwork` disabled.
- If a metadata counter goes over limit, shorten the affected text or remove
  extra airdrop, allowlist, or media data until the section drops back under
  `5000`.
- Failed supplemental uploads can be removed and retried.
- Submission/signing/API errors keep modal state open so users can retry.
- If an over-limit payload still reaches submission, the app shows an error
  toast naming the offending metadata sections and does not continue.
- If stored `additional_media` JSON is malformed, preview/promo/media sections
  do not render.
- `About the Artist` and `Artwork Commentary` can still render because they are
  stored as separate metadata keys.

## Limitations / Notes

- Prefilled payment/airdrop values remain editable.
- ENS input is accepted in payment/airdrop fields, but unresolved ENS names are
  treated as invalid.
- Allowlist contract input does not perform ENS resolution.
- For `Airdrop Distribution`, `Payment`, `Allowlist Configuration`, and
  `Supporting Media`, the counter reflects that section's stored metadata value
  rather than a single visible text field.

## Related Pages

- [Memes Submission Workflow](feature-memes-submission.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
