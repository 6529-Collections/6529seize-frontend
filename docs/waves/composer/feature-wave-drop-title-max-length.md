# Wave Drop Composer Title Length Limit

## Overview

The full wave composer input supports an optional title field for a drop, and that
title is limited to `250` characters.

## Location in the Site

- Wave thread composer and quote composer in `/waves/{waveId}`.
- Direct-message composer in `/messages?wave={waveId}`.
- Wave creation composer flow on `/waves/create`.
- Both desktop and mobile composer surfaces that render the full composer layout.

## Entry Points

- Open a wave/DM composer and tap/click `Add title` in the full composer header.
- Use any title input path that shows `Drop title` in the placeholder.

## User Journey

1. Open the full composer in desktop or mobile mode.
2. Tap `Add title` to expose the title field.
3. Type a title.
4. The input accepts up to 250 characters and blocks additional characters in-place.
5. Leave the composer row to continue with the rest of post authoring.

## Limitations / Notes

- Title entry is optional for standard composer submissions.
- The title character ceiling is enforced by the title input control, so content
  beyond 250 characters is not accepted.
- This applies uniformly to both desktop and mobile full composer variants.
- There is no inline character counter in the current title input.

## Failure and Recovery

- If a pasted or typed title appears truncated, remove/shorten it to `250`
  characters or fewer.
- If the title field is not visible, switch to the full composer mode or tap
  `Add title`.

## Related Pages

- [Waves Composer](README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
