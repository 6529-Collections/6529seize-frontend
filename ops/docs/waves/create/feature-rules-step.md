# Wave Creation Rules Step

## Overview

Use `Rules` in wave creation to review automatically generated rules and
optionally add creator-specific rules.

The step separates rules into two layers:

- visible automatic rules generated from the current wave configuration
- optional custom creator rules in an expandable creator-rules section

Creators should not retype rules that are already shown in the automatic rules
preview.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- Step label: `Rules`
- User-reachable in `Chat`, `Rank`, and `Approve` creation

## Entry Points

- Start a wave from an available create-wave control, then continue to `Rules`.
- For an existing Rank or Approve wave, open its right sidebar, select
  `Settings`, and edit `Acceptance rules` when the connected profile can
  administer the wave.

## Step Path

- `Chat`: `Overview -> Groups -> Rules -> Description`
- `Rank`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`
- `Approve`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`

## Automatic Rules Preview

The automatic rules preview summarizes configured wave behavior, including:

- wave type
- who can view and administer the wave
- who can drop and vote for `Rank` and `Approve` waves
- chat access group for `Chat` waves
- chat status (`Enabled` or `Disabled`) and chat access group for `Rank` and
  `Approve` waves
- submission and voting windows for `Rank` and `Approve` waves
- rank-wave decision timing
- standard drops or identity nominations
- required media and required metadata
- simultaneous-submission limit
- terms or signature requirements
- whether admins can delete drops
- vote credit type, scope, category, profile, and card set
- whether negative voting is allowed
- maximum votes per identity per drop
- time-weighted voting
- approve-wave threshold, hold time, max approved drops, and approval window
- outcomes visibility and configured outcome count

## Custom Creator Rules

Use display-only creator rules for wave-specific guidance that participants
should see but do not need to sign.

For `Rank` and `Approve` waves, use rules that require acceptance when
participants must explicitly agree to creator-written rules. Participants first
acknowledge the displayed rules, then sign their completed submission and those
rules together. Acknowledging the rules does not open a wallet or create a
signature.

`Chat` waves do not show acceptance-required rules because they do not have a
submission step.

## User Journey

1. Complete `Groups` for `Chat`, or `Drops` for `Rank` and `Approve`.
2. Open `Rules`.
3. Review the automatic rules preview.
4. Open `Creator rules` for Chat, or `Creator rules and acceptance` for Rank
   and Approve, only when creator-written rules are needed.
5. Optionally enter display-only creator rules.
6. For `Rank` and `Approve`, optionally enable `Require acceptance` and enter
   rules participants must accept before submitting. The guidance explains
   where participants see the rules and which later action opens their wallet.
7. Collapse the section if desired; entered rules remain in the draft
   and the disclosure shows `Customized`.
8. Click `Next` to continue to `Description` for `Chat`, or `Voting` for
   `Rank` and `Approve`.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Display-only custom rules appear in the rules panel.
- For The Memes, rules that require acceptance are the first step inside the
  artwork-submission flow. `I Agree & Continue` records the acknowledgement but
  does not open the participant's wallet.
- For other participatory waves, the rules appear in a separate `Submission
  rules` dialog after the participant uses the wave's submit action.
- In The Memes, the wallet prompt opens only from the final artwork submit
  action. In other waves, it opens from `Agree & Sign Submission`.
- The resulting wallet signature covers both the completed submission and the
  displayed rules.

## Settings

Wave admins can edit display-only custom rules and acceptance-required rules
later from wave settings.
Display-only custom rules are saved as wave metadata. For `Rank` and `Approve`,
rules that require acceptance are stored as participation terms and continue to
use the existing submit acceptance flow.

## Edge Cases

- `Chat` automatic rules focus on wave type and access. They do not show a
  chat-status enable/disable row because chat waves require chat to stay
  enabled.
- `Chat` custom rules are display-only.
- Chat's optional-section label mentions only creator rules because Chat does not
  support acceptance-required rules.
- Leaving custom-rule fields blank is valid.
- Display-only creator rules are capped at `2,000` characters.
- For `Rank` and `Approve`, turning off `Require acceptance` clears the
  acceptance-required rules text.
- For `Rank` and `Approve`, acceptance-required rules require a wallet
  signature only when rules text is present.
- Older waves can contain rules without a signature requirement, or a signature
  requirement without rules. Settings label those states `Not required` or
  `Signature only` instead of implying that both are active. Saving the
  acceptance-rules editor restores the normal pairing: non-empty rules require
  acceptance and signing, while an empty field removes both requirements.

## Failure and Recovery

- If acceptance-rule settings fail to save, the editor stays open so the
  creator can retry without re-entering the rules.
- If a participant closes the generic rules dialog, cancels the wallet request,
  or signing fails, the submission stops and the current draft remains
  available for another attempt.
- Upload failures in The Memes happen before the wallet request. Submission API
  failures happen after signing; retrying starts the final submit sequence
  again.

## Limitations / Notes

- Acceptance rules are creator-authored text. The app displays them as entered
  and does not evaluate whether the wording is complete or suitable.
- A successful wallet signature does not by itself confirm submission success;
  the app must still accept and save the submission.
- The wallet prompt signs a message for the submission. It does not request a
  payment or blockchain transaction.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
