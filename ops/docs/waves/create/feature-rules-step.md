# Wave Creation Guidelines Step

## Overview

Use `Guidelines` to add optional chat guidelines. The textbox is always visible,
with no expand/collapse control. Signing rules for Rank and Approve waves are
configured in `Drops` under `Submission requirements`. The read-only
configuration summary is in the final [Overview step](feature-final-overview-step.md).

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- Step label: `Guidelines`
- User-reachable in `Chat`, `Rank`, and `Approve` creation

## Step Path

- `Chat`: `Setup -> Access -> Guidelines -> Description -> Overview`
- `Rank`: `Setup -> Access -> Schedule -> Drops -> Voting -> Outcomes -> Guidelines -> Description -> Overview`
- `Approve`: `Setup -> Access -> Schedule -> Drops -> Voting -> Outcomes -> Guidelines -> Description -> Overview`

## Chat Guidelines

Use chat guidelines for wave-specific guidance that participants should see but
do not need to sign.
The section is titled `Chat guidelines`, with the placeholder
`Add chat guidelines...`. Its subtitle explains that users see these guidelines
when sending their first chat message.

For rules participants must explicitly accept and sign before submitting, use
`Submission requirements` in [Drops](feature-drops-step.md). `Chat` waves skip
that step.

## User Journey

1. Complete `Access` for `Chat`, `Voting` for Perpetual Ranking, or
   `Outcomes` for scheduled `Rank` and `Approve`.
2. Open `Guidelines`.
3. Optionally enter chat guidelines in the visible field.
4. Click `Next` to continue to `Description`. Guidelines is directly before
   Description for every wave type.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Chat guidelines appear under `Guidelines` in the rules panel.
- Before their first chat message, profiles with no earlier chat messages or
  participation drops in the wave review its guidelines. See
  [First Message Guidelines](../composer/feature-first-message-guidelines.md).
- For `Rank` and `Approve`, rules that require acceptance appear in the rules
  panel and are enforced by the existing submit terms/signature modal.

## Settings

Wave admins can edit chat guidelines and acceptance-required rules later from
wave settings.
Chat guidelines are saved as wave metadata. For `Rank` and `Approve`, rules
that require acceptance are stored as participation terms and continue to use
the existing submit acceptance flow.

## Edge Cases

- Chat guidelines do not require a wallet signature.
- Leaving the guidelines field blank is valid.
- Chat guidelines are capped at `2,000` characters.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
