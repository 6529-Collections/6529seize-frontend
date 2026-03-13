# Wave Creation Description Step

## Overview

The `Description` step is the final step in create-wave.
Creators write the wave description using the drop editor; this description is
submitted as the wave's initial description drop when the wave is completed.
The description editor includes an optional title input limited to `250`
characters.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Description`
- Final step before `Complete`

## Entry Points

- `Chat` flow: `Overview` -> `Groups` -> `Description`
- `Rank` flow: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Voting` ->
  `Outcomes` -> `Description`

## User Journey

1. Open `Description`.
2. Compose the wave description in the drop editor (body text, optional title,
   and supported drop-editor content).
3. Click `Complete`.
4. Confirm authentication when prompted.
5. On success, the app navigates to the new wave route at `/waves/{waveId}`.

## Common Scenarios

- Add a short summary description and complete immediately.
- Add richer context, formatting, and an optional title before publishing.
- Go back to earlier steps, adjust configuration, then return and complete.

## Edge Cases

- If description content is empty, completion is blocked and the editor shows a
  drop-content error.
- If title text exceeds `250` characters, extra characters are not accepted in
  the title field.
- If admin-group resolution fails at submit time, creation stops and stays in
  the flow.
- If picture upload or wave-create API requests fail, users see an error toast
  and remain in create-wave.

## Failure and Recovery

- If authentication fails, re-authenticate and click `Complete` again.
- If completion fails after edits, keep current step data and retry without
  restarting.
- If content error appears, add description content and submit again.

## Limitations / Notes

- There is no separate pre-submit review step after `Description`.
- Title is optional and capped at `250` characters in this editor.
- Completion submits all prior configuration plus this description drop in one
  request.
- Successful completion redirects directly to the created wave route.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Outcomes Setup](feature-outcomes-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Docs Home](../../README.md)
