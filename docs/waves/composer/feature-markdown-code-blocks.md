# Wave Drop Markdown Code Blocks

## Overview

Wave composers and drop rendering support fenced markdown code blocks.
Code stays literal through compose, post, and edit flows.

## Location in the Site

- Wave threads: `/waves/{waveId}` (canonical thread route; `/waves?wave={waveId}`
  redirects to this route)
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; there is
  no `/messages/{waveId}` thread route)
- Existing drop edit modal opened from a drop action menu

## Entry Points

- Type fenced markdown in a composer (triple backticks with an optional
  language hint).
- Paste code from an editor/IDE into a drop composer.
- Open a drop that already contains fenced code.
- Choose `Edit message...` on a drop that contains code.

## User Journey

1. Open a wave/DM composer, or open edit mode on an existing drop.
2. Add code as fenced markdown, optionally including a language label.
3. Submit a new drop (or save the edited drop).
4. Read the posted drop with code rendered as a block.
5. Re-open in edit mode, adjust fenced markdown, and save.

## Common Scenarios

- Code pasted from rich-text sources is inserted as plain text, which keeps
  raw characters and spacing without bringing formatting from the source app.
- Inside fenced code, `@[handle]`, `#[wave_name]`, and `$[name]` stay literal.
- Fenced blocks with recognized language hints render with syntax highlighting.
- Inline backtick code stays inline and is not converted into a fenced block.

## Edge Cases

- If no language hint is provided, highlighting uses best-effort auto-detection.
- Unsupported language hints are ignored and fall back to auto-detection.
- Empty/whitespace-only code blocks render without syntax-coloring output.
- In edit mode, code is preserved as fenced markdown text rather than a
  separate code-block editing widget.

## Failure and Recovery

- If syntax highlighting cannot be applied, code still renders as readable text.
- If users expected code-fence tokens to become interactive, move outside the
  code block and re-enter `@[...]`, `#[...]`, or `$[...]` in normal text.
- If pasted content contains formatting users wanted to keep, they can reapply
  markdown formatting manually after paste.

## Limitations / Notes

- Syntax highlighting is best-effort and only guaranteed for the supported
  language aliases: `ts`, `tsx`, `typescript`, `js`, `jsx`, `javascript`,
  `json`, `bash`, `shell`, `py`, `python`, `go`, `golang`, `rust`, `rs`,
  and `sql`.
- Highlight appearance follows the site’s current global highlight theme.
- This page covers markdown code behavior in wave composer and drop rendering
  surfaces.
- Create-wave description-step behavior is documented separately in create-area
  docs.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
