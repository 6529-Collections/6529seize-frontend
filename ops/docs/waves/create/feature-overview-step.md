# Wave Creation Overview Step

## Overview

`Overview` is the first step in wave creation.
Set the wave name and type before moving to later steps. Optional picture,
display, and label controls stay available under `Advanced settings`.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode: `?create=wave` on supported waves and
  messages routes
  - route ownership: [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- Step label: `Overview`
- Create form renders only when a connected profile is available.

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Rules` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`

## Essential Setup

- `Name` (required)
- `Wave Type`
  - `Chat`
  - `Rank`
  - `Approve`
- `Ranking mode` for `Rank` waves:
  - `Announce Winners`
  - `Perpetual Ranking`

## Advanced Settings

`Advanced settings` starts collapsed so the normal path shows only the
essential choices. Its summary always remains visible.

- `Wave picture` (optional)
  - upload by click
  - or drag and drop
- Submission-button label for `Rank` and `Approve` waves.
- `Compact proposal cards` for `Rank` and `Approve` waves:
  - defaults to off
  - when enabled, published proposals use compact previews that open the
    complete original proposal
- Approve tab labels for `Approve` waves:
  - proposals tab defaults to `Proposals`
  - approved tab defaults to `Approved`
- Uploaded image shows a preview; `Delete` removes it.
- File input and drag-drop both use the first selected file.
- When any optional value differs from its default, the collapsed section shows
  `Customized` so a resumed draft cannot silently carry hidden configuration.

## Navigation Behavior

- `Overview` always opens first.
- `Next` moves to `Groups` when overview validation passes.
- `Next` stays enabled; validation runs when clicked.
- `Previous` is not shown on `Overview`.
- On large screens, the step rail can reopen completed steps, including
  `Overview`.
- On smaller screens, use `Previous` from later steps to return to `Overview`.
- `Advanced settings` is a keyboard-operable disclosure with an exposed
  expanded/collapsed state.

## Validation and State Rules

- Empty name blocks forward navigation and shows `Name is required`.
- Name length above `250` characters blocks forward navigation.
- Image upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP` only.
- Unsupported image formats show toast: `Invalid file type`.
- Images larger than `10MB` show toast: `File size must be less than 10MB`.
- Changing wave type resets all non-overview settings to that type's defaults
  (`groups`, `chat`, `dates`, `drops`, `voting`, `outcomes`).
- `Compact proposal cards` defaults to off. Enabling it stores the Wave-level
  display choice when the Wave is created; it does not alter Chat messages or
  specialized Memes, Curation, and Quorum presentations.
- If an advanced label is invalid, `Next` opens `Advanced settings`, shows
  `Needs attention`, and moves focus to the first invalid field.
- Loading a draft preserves its optional display and label values. Wave picture
  files and the description are not stored in on-device drafts.

## Failure and Recovery

- If `Next` does not advance, confirm name is present and `<= 250` characters.
- If upload validation fails, pick a supported file under `10MB` and retry.
- If `Advanced settings` opens after `Next`, correct the highlighted label and
  try again.
- If type changes reset later steps, confirm the final type first, then
  reconfigure later steps.
- If stale modal state appears, close create-wave to clear the `create` query,
  then reopen.

## Limitations / Notes

- This page documents wave-creation `Overview` only.
- Direct-message creation is documented separately.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Compact Proposal Cards](../drop-actions/feature-proposal-cards.md)
- [Docs Home](../../README.md)
