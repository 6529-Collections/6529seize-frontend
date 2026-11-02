# Wave Creation Guidelines Step

## Overview

Use `Guidelines` to add optional chat guidelines. For standalone Chat, expand
`Optional settings` on the first screen to show the textbox. In guided creation,
the textbox is visible on the `Guidelines` step. Signing rules are configured separately
in competition `Drops` under `Submission requirements`. The read-only
configuration summary is in the final [Overview step](feature-final-overview-step.md).

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- Guided step label: `Guidelines`
- Available for new chat waves and subwaves

## Step Path

- Standalone `Chat`: `Start a chat wave -> Review`
- Chat subwave: `Setup -> Access -> Guidelines -> Description -> Overview`

## Chat Guidelines

Use chat guidelines for wave-specific guidance that participants should see but
do not need to sign.
The section is titled `Chat guidelines`, with the placeholder
`Add chat guidelines...`. Its subtitle explains that users see these guidelines
when sending their first chat message.

For rules participants must explicitly accept and sign before submitting, use
`Submission requirements` in [Drops](../competitions/setup/feature-drops-step.md). `Chat` waves skip
that step.

## User Journey

For standalone Chat, expand `Optional settings`, enter guidelines if needed,
then select `Review wave` after completing the name and first post.

For guided creation:

1. Complete `Access` for a subwave.
2. Open `Guidelines`.
3. Optionally enter chat guidelines in the visible field.
4. Click `Next` to continue to `Description`.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Chat guidelines appear under `Guidelines` in the rules panel.
- Before their first chat message, profiles with no earlier chat messages or
  participation drops in the wave review its guidelines. See
  [First Message Guidelines](../composer/feature-first-message-guidelines.md).
- Competition terms are shown with that competition and accepted when submitting
  an entry. They are separate from shared chat guidelines.

## Settings

Wave admins can edit chat guidelines later from wave settings. Chat guidelines
are saved as wave metadata. Competition terms are managed in each competition’s
[Settings](../competitions/feature-manage-competitions.md).

## Edge Cases

- Chat guidelines do not require a wallet signature.
- Leaving the guidelines field blank is valid.
- Chat guidelines are capped at `2,000` characters.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Drop Settings](../competitions/setup/feature-drops-step.md)
- [Wave Creation Voting Configuration](../competitions/setup/feature-voting-step.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
