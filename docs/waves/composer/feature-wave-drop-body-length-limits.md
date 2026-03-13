# Wave Drop Composer Body Length Limits and Storm Rules

## Overview

The wave composer enforces two different free-text limits:

- A hard input cap of `25,000` characters for every composer body input.
- In storm mode, the combined body length across existing parts plus the active
  draft must stay below `24,000` characters.
- In storm mode after at least one part already exists, the active draft must be
  `240` characters or less before final submit.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Both desktop and mobile thread composer surfaces.

## Entry Points

- Open a wave or DM composer and start typing in the body field.
- Enable storm mode and add additional parts for multipart drops.

## User Journey

1. Type markdown content in the body editor.
2. In regular single-part mode, input is trimmed at `25,000` characters.
3. Switch to storm mode and split content into parts.
4. Keep adding storm parts until the aggregate total (previous parts + current
   draft) reaches the combined threshold limit.
5. After at least one storm part exists, shorten the active draft to `240`
   characters or less before final submit.
6. Submit once content-length and metadata/media requirements are satisfied.

## Common Scenarios

- Single-part drops can exceed `240` characters and submit normally when under
  `25,000`.
- Users can split long content into storm parts for pacing.
- The compose UI shows the storm part length only after storm mode has active
  parts.
- When the active draft is over `240` with existing storm parts, length text is
  shown in error state to indicate the submission block.

## Edge Cases

- If there is no prior storm part, the `240`-character rule does not block
  regular single-part submission.
- If there is no prior storm part, users can still split a long draft into storm
  mode; the `240` limit is enforced before final storm submit once parts exist.
- `25,000` characters is a hard editor cap; extra characters are not retained
  in the draft.
- In storm mode with existing parts, an active draft over `240` prevents final
  submission until fixed.
- In storm mode, aggregate content at or above `24,000` blocks adding another
  storm part.
- Files and metadata requirements are evaluated in addition to text-length
  limits before submit.
- Thread/DM composer submissions always send `title` as empty (`null`); title
  entry is not part of this composer flow.

## Failure and Recovery

- If length limits block submission or adding a part, shorten the current draft
  or submit the current storm and continue in a fresh composer draft.
- If storm length indicators are over threshold, reduce the active part to
  `240` characters before splitting/finalizing.
- For very large posts, stay in single-part mode and submit under `25,000` when that is a better fit.

## Limitations / Notes

- Storm caps apply to body text behavior, not file upload count or file sizes.
- Part-length checks apply in storm submission state, not in single-part compose
  mode.
- Create-wave `Description` step behavior uses a different editor stack and is
  documented in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
