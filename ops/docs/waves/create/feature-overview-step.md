# Wave Creation Overview Step

## Overview

`Overview` is the first step in wave creation.
Set the wave name, optional image, and wave type before moving to later steps.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode: `?create=wave` on supported waves and
  messages routes
  - route ownership: [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- Step label: `Overview`
- Content heading: `Create Wave`
- Create form renders only when a connected profile is available.

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Rules` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Groups` -> `Schedule` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`

## What You Can Set

- `Name` (required)
- `Wave Profile Picture` (optional)
  - upload by click
  - or drag and drop
- `Wave Type`
  - `Chat`
  - `Rank`
  - `Approve`
- `Ranking mode` for `Rank` waves:
  - `Announce Winners`
  - `Perpetual Ranking`
- `Display settings` inside `Appearance and labels` for `Rank` and `Approve`
  waves:
  - submission-button label
  - proposal-card appearance
  - Approve tab labels for `Approve` waves
- `Proposal card appearance` for `Rank` and `Approve` waves:
  - open `Appearance and labels` to change the proposal-card presentation
  - `Summary card` is the default for new waves and applies a reusable compact
    presentation in chat and list views
  - `Full proposal` keeps the previous full-content presentation
  - `Text preview limit` accepts a whole-number proposal-text limit from `120`
    to `1000` characters and controls excerpt length
  - `Image on summary card` controls whether the first ready still image
    appears beside the summary
- Approve tab labels:
  - appear in their own `Tab labels` group under `Appearance and labels`
  - proposals tab defaults to `Proposals`
  - approved tab defaults to `Approved`
- Uploaded image shows a preview; `Delete` removes it.
- File input and drag-drop both use the first selected file.

## Navigation Behavior

- `Overview` always opens first.
- `Next` moves to `Groups` when overview validation passes.
- `Next` stays enabled; validation runs when clicked.
- `Previous` is not shown on `Overview`.
- On large screens, the step rail can reopen completed steps, including
  `Overview`.
- On smaller screens, use `Previous` from later steps to return to `Overview`.

## Validation and State Rules

- Empty name blocks forward navigation and shows `Name is required`.
- Name length above `250` characters blocks forward navigation.
- A Summary card proposal-text limit outside `120`–`1000`, or a value that is
  not a whole number, blocks forward navigation and focuses the invalid field.
- Image upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP` only.
- Unsupported image formats show toast: `Invalid file type`.
- Images larger than `10MB` show toast: `File size must be less than 10MB`.
- Changing wave type resets all non-overview settings to that type's defaults
  (`groups`, `chat`, `dates`, `drops`, `voting`, `outcomes`).
- Outcome visibility is configured on the `Outcomes` step for scheduled `Rank`
  and `Approve` waves.
- `Proposal card appearance` is inside `Appearance and labels` and defaults to
  `Summary card` for newly created Waves. The default stores a versioned
  Wave-level display recipe when the Wave is created. Existing Waves and older
  drafts without this setting keep the `Full proposal` presentation. The 6529
  Network Museum compatibility fallback uses `Summary card` until an explicit
  setting is saved. The setting does not alter Chat messages or specialized
  Memes, Curation, and Quorum presentations.

## Failure and Recovery

- If `Next` does not advance, confirm name is present and `<= 250` characters.
- If upload validation fails, pick a supported file under `10MB` and retry.
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
- [Summary Proposal Cards](../drop-actions/feature-proposal-cards.md)
- [Docs Home](../../README.md)
