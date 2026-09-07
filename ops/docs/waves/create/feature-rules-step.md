# Wave Creation Guidelines Step

## Overview

Use `Guidelines` to add optional wave guidelines and, for Rank and Approve waves,
rules that participants must accept. The fields are always visible, with no
expand/collapse control. The read-only configuration summary is
in the final [Overview step](feature-final-overview-step.md).

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

- `Chat`: `Setup -> Groups -> Guidelines -> Description -> Overview`
- `Rank`: `Setup -> Groups -> Schedule -> Drops -> Guidelines -> Voting -> Outcomes -> Description -> Overview`
- `Approve`: `Setup -> Groups -> Schedule -> Drops -> Guidelines -> Voting -> Outcomes -> Description -> Overview`

## Wave Guidelines

Use wave guidelines for wave-specific guidance that participants should see but
do not need to sign.
The section is titled `Wave guidelines`, with the placeholder
`Add wave guidelines...`. Its subtitle explains that users see these guidelines
when sending their first chat message.

For `Rank` and `Approve` waves, use rules that require acceptance when
participants must explicitly accept and sign those rules before submitting.
These rules use the existing participation terms and wallet-signature flow.
`Chat` waves do not show acceptance-required rules because they do not have a
submission step.

## User Journey

1. Complete `Groups` for `Chat`, or `Drops` for `Rank` and `Approve`.
2. Open `Guidelines`.
3. Optionally enter wave guidelines in the visible field.
4. For `Rank` and `Approve`, optionally enter rules participants must accept
   and sign before submitting. This textbox is always visible. Leave it empty
   if no rules require signing.
5. Click `Next` to continue to `Description` for `Chat`, or `Voting` for
   `Rank` and `Approve`.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Wave guidelines appear under `Guidelines` in the rules panel.
- Before their first chat message, profiles with no earlier chat messages or
  participation drops in the wave review its guidelines. See
  [First Message Guidelines](../composer/feature-first-message-guidelines.md).
- For `Rank` and `Approve`, rules that require acceptance appear in the rules
  panel and are enforced by the existing submit terms/signature modal.

## Settings

Wave admins can edit wave guidelines and acceptance-required rules later from
wave settings.
Wave guidelines are saved as wave metadata. For `Rank` and `Approve`, rules
that require acceptance are stored as participation terms and continue to use
the existing submit acceptance flow.

## Edge Cases

- Wave guidelines do not require a wallet signature. `Chat` does not show the
  separate rules that require signing before participation.
- Leaving custom-rule fields blank is valid.
- Wave guidelines are capped at `2,000` characters.
- For `Rank` and `Approve`, clearing the acceptance-required rules textbox
  removes the signature requirement. Whitespace-only text also counts as empty.
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
