# Wave Drop Composer Body Length Limits and Storm Rules

## Overview

The wave composer enforces two different free-text limits:

- A hard input cap of `25,000` characters for every composer body input.
- A storm mode cap for multipart posts: each added storm part is limited to `240` characters and
  the combined body length for all parts is capped below `24,000` characters.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Full composer: `/waves/create`
- Both desktop and mobile composer surfaces that render the full drop input.

## Entry Points

- Open a wave or DM composer and start typing in the body field.
- In compact composer mode, switch to full composer to access metadata/file controls as needed.
- Enable storm mode and add additional parts for multipart drops.

## User Journey

1. Type markdown content in the body editor.
2. In regular single-part mode, input is trimmed at `25,000` characters.
3. Click/trigger storm split to add the current part.
4. In storm mode, keep each part at or below `240` characters.
5. Keep adding storm parts until the aggregate total (previous parts + current draft) reaches the
   combined threshold limit; split options are then blocked.
6. Submit as long as all required requirements are satisfied and no storm split limit is currently
   active.

## Common Scenarios

- Single-part drops can exceed `240` characters and submit normally when under `25,000`.
- Storm mode is still useful for readability and cadence, but each split part must stay short.
- The compose UI shows the storm part length only when storm mode has active parts.
- When a storm part is over-length, length text is shown in error state to indicate the violation.

## Edge Cases

- If there is no prior storm part, the `240`-character rule does not block regular single-part
  submission.
- `25,000` characters is a hard editor cap; extra characters are not retained in the draft.
- In storm mode, a part over `240` prevents final submission until fixed.
- In storm mode, aggregate content above `24,000` prevents adding another storm part.
- Files and metadata requirements are evaluated in addition to text-length limits before submit.

## Failure and Recovery

- If length limits block submission or adding a part, shorten the current draft or submit the current
  storm and continue in a fresh composer draft.
- If storm length indicators are over threshold, reduce the active part to `240` characters before
  splitting/finalizing.
- For very large posts, stay in single-part mode and submit under `25,000` when that is a better fit.

## Limitations / Notes

- Storm caps apply to body text behavior, not file upload count or file sizes.
- Part-length checks are enforced by composer logic rather than a separate per-part input field.

## Related Pages

- [Waves Composer](README.md)
- [Wave Drop Composer Title Max Length](feature-wave-drop-title-max-length.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Docs Home](../../README.md)
