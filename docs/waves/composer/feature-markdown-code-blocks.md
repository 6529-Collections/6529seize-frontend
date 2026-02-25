# Wave Drop Markdown Code Blocks

## Overview

Wave drop composers and drop cards support fenced markdown code blocks. Users
can write, paste, submit, read, and edit code snippets while keeping them as
code content instead of converting them into mention/hashtag entities.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- DM wave threads: `/messages?wave={waveId}`
- Existing drop edit modal opened from a drop action menu
- Wave creation flow description editor: `/waves/create`

## Entry Points

- Type fenced markdown in a composer (for example, triple backticks with an
  optional language hint).
- Paste code from an editor/IDE into a drop composer.
- Open a drop that already contains fenced code.
- Choose `Edit message` on a drop that contains code.

## User Journey

1. Open a wave/DM composer (or the wave creation description editor).
2. Add code as fenced markdown, optionally including a language label.
3. Continue writing surrounding text as needed.
4. Submit the drop.
5. Read the posted drop with code rendered as a block and syntax-highlighted
   when language detection succeeds.
6. Re-open in edit mode, adjust fenced markdown, and save.

## Common Scenarios

- Code pasted from rich-text sources is inserted as plain text, which keeps
  raw characters and spacing without bringing formatting from the source app.
- Inside code context, `@` mentions, `#` wave mentions, and `$` NFT hashtag
  suggestions stay inactive so code text remains literal.
- Fenced blocks with recognized language hints render with syntax coloring.
- Inline backtick code remains inline and is not converted to a multi-line
  code block.

## Edge Cases

- When no language hint is provided, highlighting falls back to best-effort
  auto-detection.
- Language hints outside the supported set are ignored for explicit language
  mode and fall back to best-effort detection.
- Empty/whitespace-only code blocks render without syntax-coloring output.
- In edit mode, code is preserved as fenced markdown text rather than a
  separate code-block editing widget.

## Failure and Recovery

- If syntax highlighting cannot be applied (for example, detection/import
  issues), the code text still renders and remains readable.
- If users expected mentions/hashtags inside code to become interactive, they
  can move outside the code block and re-enter those tokens in normal text.
- If pasted content contains formatting users wanted to keep, they can reapply
  markdown formatting manually after paste.

## Limitations / Notes

- Syntax highlighting is best-effort and only guaranteed for the supported
  language aliases: `ts`, `tsx`, `typescript`, `js`, `jsx`, `javascript`,
  `json`, `bash`, `shell`, `py`, `python`, `go`, `golang`, `rust`, `rs`,
  and `sql`.
- Highlight appearance follows the site’s current global highlight theme.
- This page covers markdown code behavior in wave-related drop composers and
  wave drop rendering surfaces.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Docs Home](../../README.md)
