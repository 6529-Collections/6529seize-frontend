# Wave Drop Markdown Code Blocks

## Overview

Wave and DM composers support fenced markdown code blocks.
Posted drops render fenced code in-place in the thread.

`Edit Message` keeps code blocks as fenced markdown text, so code survives
compose, post, and edit without switching to a separate code-block widget.

## Location in the Site

- Wave threads: `/waves/{waveId}` (canonical thread route; `/waves?wave={waveId}`
  redirects to this route)
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; there is
  no `/messages/{waveId}` thread route)
- Inline `Edit Message` mode opened from drop actions (shown only on your own
  non-participatory drops)
- Wave/DM drop rendering surfaces that use the shared markdown renderer

## Entry Points

- Type fenced markdown in a composer (triple backticks with an optional
  language hint).
- Paste code from an editor/IDE into a drop composer.
- Open `Edit Message` on a drop that already contains fenced code.

## User Journey

1. Open a wave or DM thread.
2. Add fenced markdown in the composer (optionally with a language hint).
3. Submit the drop.
4. Read the posted drop with block code rendering.
5. Open `Edit Message`, update fenced markdown, and save.
6. Reopen the drop and confirm the updated code renders correctly.

## Common Scenarios

- Pasting from rich-text sources inserts plain text only, so source formatting
  is not carried into the composer.
- Inside fenced code, `@[handle]`, `#[wave_name]`, and `$[name]` stay literal
  instead of becoming interactive mention/NFT links.
- Fenced blocks with supported language hints render with syntax highlighting.
- Inline backtick code stays inline and is not converted into a fenced block.

## Edge Cases

- If no language hint is provided, highlighting uses best-effort auto-detection.
- Unsupported language hints are ignored and fall back to auto-detection.
- Empty/whitespace-only code blocks render without syntax-coloring output.
- Participatory drops do not expose `Edit Message`, so only chat/winner drops
  follow the edit flow above.

## Failure and Recovery

- If syntax highlighting fails, code still renders as readable text.
- If users expected code-fence tokens to become interactive, move outside the
  code block and re-enter `@[...]`, `#[...]`, or `$[...]` in normal text.
- If pasted content loses rich formatting, reapply markdown manually.
- If edit save fails, the app shows an error toast. Re-open `Edit Message` and
  retry.

## Limitations / Notes

- Syntax highlighting registers these language aliases: `ts`, `tsx`,
  `typescript`, `js`, `jsx`, `javascript`, `json`, `bash`, `shell`, `py`,
  `python`, `go`, `golang`, `rust`, `rs`, and `sql`.
- Highlight styling follows the app’s global Highlight.js theme.
- This page covers wave/DM composer, inline edit, and drop rendering behavior.
- Create-wave description-step behavior is documented separately in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Mentions and NFT Hashtag Syntax](feature-wave-mentions.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
