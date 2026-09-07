# Wave Creation Rules Step

## Overview

Use `Rules` to add optional wave guidelines and, for Rank and Approve waves,
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
- Step label: `Rules`
- User-reachable in `Chat`, `Rank`, and `Approve` creation

## Step Path

- `Chat`: `Setup -> Groups -> Rules -> Description -> Overview`
- `Rank`: `Setup -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description -> Overview`
- `Approve`: `Setup -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description -> Overview`

## Wave Guidelines

Use wave guidelines for wave-specific guidance that participants should see but
do not need to sign.

For `Rank` and `Approve` waves, use rules that require acceptance when
participants must explicitly accept and sign those rules before submitting.
These rules use the existing participation terms and wallet-signature flow.
`Chat` waves do not show acceptance-required rules because they do not have a
submission step.

## User Journey

1. Complete `Groups` for `Chat`, or `Drops` for `Rank` and `Approve`.
2. Open `Rules`.
3. Optionally enter wave guidelines in the visible field.
4. For `Rank` and `Approve`, optionally enable `Require acceptance` and enter
   rules participants must accept before submitting.
5. Click `Next` to continue to `Description` for `Chat`, or `Voting` for
   `Rank` and `Approve`.

## Participant Visibility

- Desktop participants can open `Rules` in the wave right sidebar for any wave.
- Mobile participants see the rules panel from the wave `About` information
  path.
- Wave guidelines appear under `Guidelines` in the rules panel.
- For `Rank` and `Approve`, rules that require acceptance appear in the rules
  panel and are enforced by the existing submit terms/signature modal.

## Settings

Wave admins can edit wave guidelines and acceptance-required rules later from
wave settings.
Wave guidelines are saved as wave metadata. For `Rank` and `Approve`, rules
that require acceptance are stored as participation terms and continue to use
the existing submit acceptance flow.

## Edge Cases

- `Chat` wave guidelines do not require acceptance.
- Chat's section heading mentions only wave guidelines because Chat does
  not support acceptance-required rules.
- Leaving custom-rule fields blank is valid.
- Wave guidelines are capped at `2,000` characters.
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
