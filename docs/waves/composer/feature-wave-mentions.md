# Wave Mentions and NFT Hashtag Syntax

## Overview

Wave composers support two reference token types:

- `#` opens wave mention suggestions and inserts `#[wave_name_in_content]` when selected.
- `$[name]` references NFTs. `#[name]` is reserved for wave mentions.

After submit, resolved wave mentions render as clickable links to the mentioned
wave. When available, the link includes a small wave avatar and shows a summary
tooltip on non-touch devices.

## Location in the Site

- Wave threads: `/waves/{waveId}` (canonical thread route; legacy
  `/waves?wave={waveId}` normalizes to this route)
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; no
  `/messages/{waveId}` thread route)

## Entry Points

- Open a wave or DM composer and type in the body.
- Type `#` plus part of a wave name.
- Select a suggestion from the wave mention menu.
- Optionally add NFT references with `$[name]`.
- Submit the drop.

## User Journey

1. Type `#` plus a wave name fragment.
2. The suggestion list shows matching waves.
3. Pick a wave by pressing `Enter`, clicking the suggestion, or using keyboard
   navigation.
4. The composer inserts `#[wave_name_in_content]`.
5. Continue editing and submit the drop.
6. The rendered mention opens `/waves/{waveId}` and shows a hover tooltip on
   non-touch devices.

## Common Scenarios

- Mentioning another wave while composing in `/waves/{waveId}`.
- Mentioning a wave while composing in `/messages?wave={waveId}`.
- Opening a posted mention link to jump to `/waves/{waveId}`.
- Mixing wave mentions with NFT references using `$[name]`.

## Edge Cases

- In fenced code blocks, mention suggestions are disabled, so `#` and `$[...]`
  stay literal.
- If a token was not tracked as a wave mention, it stays plain `#` text in the
  rendered drop.
- If a wave name contains `]`, that character is removed when the mention is
  inserted.
- Avatar chips appear only when the mentioned wave has a picture.

## Failure and Recovery

- If suggestions fail to load, continue with plain text and retry mention
  selection later.
- If a posted mention renders as plain text, edit the drop and re-select the
  wave from suggestions.
- For NFT references, use `$[name]` (not `#[name]`).

## Limitations / Notes

- Wave mention links require matching mention metadata.
- Unresolved mention text renders as plain inline text without wave tooltip
  behavior.
- Wave mention links target `/waves/{waveId}` even when authored from DM
  threads.
- Suggestion results are search-based matches, not a full list of waves.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
