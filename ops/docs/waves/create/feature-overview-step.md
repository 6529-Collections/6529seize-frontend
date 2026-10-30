# Wave Creation Setup Step

## Overview

`Setup` is the first step in wave creation.
A standalone Chat wave starts with its name and first post on one screen.
Use Optional settings for access, picture, and guidelines, then Review wave.
Subwaves use the guided steps. Rank and Approve are configured separately in [competition setup](../competitions/feature-manage-competitions.md).

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode: `?create=wave` on supported waves and
  messages routes
  - route ownership: [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- Step label: `Setup`
- Content heading: `Create Wave` for a standalone wave.
- For a subwave, both the modal header and Setup heading say
  `Create subwave of "parent wave name"`. The fields are labeled
  `Subwave Name` and `Subwave Profile Picture`.
- The `Saved Drafts` list is hidden during subwave creation.
- Create form renders only when a connected profile is available.

## What You Can Set

- Name (required).
- First post (required), with optional media.
- Wave profile picture, access, chat permissions and guidelines in Optional settings.
- For subwaves, the guided setup retains the parent access and administrator defaults.

Wave creation opens shared chat. To add Rank or Approve rules, open the created wave's **Competitions**, then **+ Competition**. Competition type, schedule, entry requirements, voting, outcomes and appearance are configured there.

## Navigation Behavior

- `Setup` always opens first.
- Chat: `Review wave` validates the name, first post, and restricted permissions.
- For subwaves, `Next` moves to `Access` when setup validation passes.
- `Next` stays enabled; validation runs when clicked.
- `Previous` is not shown on `Setup`.
- On large screens, the step rail can reopen completed steps, including
  `Setup`.
- On smaller screens, use `Previous` from later steps to return to `Setup`.

## Validation and State Rules

- Empty name blocks forward navigation and shows `Name is required`.
- Name length above `250` characters blocks forward navigation.
- Image upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP` only.
- Unsupported image formats show toast: `Invalid file type`.
- Images larger than `10MB` show toast: `File size must be less than 10MB`.
- Restoring an older saved draft keeps its wave name, permissions and first post. Wave creation always opens shared chat; competition rules are configured separately.

## Failure and Recovery

- If `Next` does not advance, confirm name is present and `<= 250` characters.
- If upload validation fails, pick a supported file under `10MB` and retry.
- Named standalone waves save settings and first-post text under Saved Drafts
  for the current wallet and profile on this device. Add media again after restoring.
- If stale modal state appears, close create-wave to clear the `create` query,
  then reopen.

## Limitations / Notes

- This page documents wave-creation `Setup` only.
- Direct-message creation is documented separately.

## Related Pages

- [Final Overview](feature-final-overview-step.md)

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Guidelines Step](feature-rules-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Summary Proposal Cards](../drop-actions/feature-proposal-cards.md)
- [Docs Home](../../README.md)
