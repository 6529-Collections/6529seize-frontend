# Wave Creation Rules Step

## Overview

Use `Rules` in wave creation to review automatically generated rules and
optionally add creator-specific rules.

The step separates rules into two layers:

- automatic rules generated from the current wave configuration
- optional custom creator rules

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
participants must explicitly accept and sign those rules before submitting.
These rules use the existing participation terms and wallet-signature flow.
`Chat` waves do not show acceptance-required rules because they do not have a
submission step.

## User Journey

1. Complete `Groups` for `Chat`, or `Drops` for `Rank` and `Approve`.
2. Open `Rules`.
3. Review the automatic rules preview.
4. Optionally enter display-only creator rules.
5. For `Rank` and `Approve`, optionally enable `Require acceptance` and enter
   rules participants must accept before submitting.
6. Click `Next` to continue to `Description` for `Chat`, or `Voting` for
   `Rank` and `Approve`.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Display-only custom rules appear in the rules panel.
- For `Rank` and `Approve`, rules that require acceptance appear in the rules
  panel and are enforced by the existing submit terms/signature modal.

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
- Leaving custom-rule fields blank is valid.
- Display-only creator rules are capped at `2,000` characters.
- For `Rank` and `Approve`, turning off `Require acceptance` clears the
  acceptance-required rules text.
- For `Rank` and `Approve`, acceptance-required rules require a wallet
  signature only when rules text is present.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
