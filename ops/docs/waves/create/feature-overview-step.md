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
- Create form renders only when a connected profile is available.

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Rules` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
  `Voting` -> `Outcomes` -> `Description`
- `Approve`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Rules` ->
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
- `Show outcomes` for `Rank` and `Approve` waves.
- Approve tab labels for `Approve` waves:
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
- Image upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP` only.
- Unsupported image formats show toast: `Invalid file type`.
- Images larger than `10MB` show toast: `File size must be less than 10MB`.
- Changing wave type resets all non-overview settings to that type's defaults
  (`groups`, `chat`, `dates`, `drops`, `voting`, `outcomes`).
- `Show outcomes` defaults to on. Turning it off hides outcome displays after
  the wave is created.

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
- [Docs Home](../../README.md)
