# Wave Creation Overview Step

## Overview

The `Overview` step sets the base identity for a new wave:

- wave name
- wave profile picture
- wave type

This step is required before group, timeline, and posting configuration.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Overview`

## Entry Points

- Start create-wave from `/waves/create`.
- Start create-wave from desktop entry points that open the create modal.
- Return to `Overview` from later steps using the step rail.

## User Journey

1. Open `Overview`.
2. Enter wave `Name` (required).
3. Optionally add `Wave Profile Picture` by click-upload or drag-drop.
4. Select `Wave Type`:
   - `Chat`
   - `Rank`
   - `Approve` (shown but disabled)
5. Continue to `Groups`.

## Common Scenarios

- Create a chat-only wave by keeping `Chat` selected.
- Create a ranked-submission wave by switching to `Rank`.
- Upload a picture to replace the default empty avatar before continuing.
- Remove a selected image before moving to the next step.

## Edge Cases

- Missing name blocks forward navigation until filled.
- Unsupported image formats show `Invalid file type`.
- Images above 10MB show `File size must be less than 10MB`.
- Switching wave type from `Rank` back to `Chat` resets later-step values to
  type defaults.

## Failure and Recovery

- If upload validation fails, select another file and retry.
- If you accidentally changed type and lost later-step inputs, reapply settings
  in those steps after confirming type.
- If stale create state appears in a modal context, close and reopen create-wave
  to restart with clean defaults.

## Limitations / Notes

- `Approve` exists in the selector UI but is currently disabled.
- Name length is limited; overly long names fail step validation.
- Picture upload supports `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP` up to 10MB.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Docs Home](../../README.md)
