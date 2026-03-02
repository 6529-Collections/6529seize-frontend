# Wave Mentions and NFT Hashtag Syntax

## Overview

Wave composers support two reference token types:

- `#` opens wave mention suggestions and inserts a wave mention token.
- `$` opens NFT hashtag suggestions and inserts an NFT token.
- Selected tokens serialize as `#[wave_name_in_content]` and `$[name]` when the
  drop is submitted.

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
- Optionally type `$` and select an NFT hashtag suggestion.
- Submit the drop.

## User Journey

1. Type `#` plus a wave name fragment.
2. The suggestion list shows matching waves.
3. Pick a wave by pressing `Enter`, clicking the suggestion, or using keyboard
   navigation.
4. The composer inserts a wave mention token into the draft.
5. Continue editing and submit the drop.
6. Submitted mention metadata renders as `#[wave_name_in_content]` in markdown
   and opens `/waves/{waveId}` with a hover tooltip on
   non-touch devices.

## Common Scenarios

- Mentioning another wave while composing in `/waves/{waveId}`.
- Mentioning a wave while composing in `/messages?wave={waveId}`.
- Opening a posted mention link to jump to `/waves/{waveId}`.
- Mixing wave mentions with NFT hashtag references in one drop.

## Edge Cases

- In fenced code blocks, mention suggestions are disabled, so `#` and `$[...]`
  stay literal.
- If a token was not tracked as a wave mention, it stays plain `#` text in the
  rendered drop.
- If `$[name]` is typed manually without selecting an NFT suggestion, it can
  remain plain text and may not resolve as an NFT reference.
- If a wave name contains `]`, that character is removed when the mention is
  inserted.
- Avatar chips appear only when the mentioned wave has a picture.

## Failure and Recovery

- If suggestions fail to load, continue with plain text and retry mention
  selection later.
- If a posted mention renders as plain text, edit the drop and re-select the
  wave from suggestions.
- For NFT references, use the `$` suggestion menu and reselect the token before
  submitting.

## Limitations / Notes

- Wave mention links require matching mention metadata.
- NFT references also require tracked metadata; plain typed text does not
  guarantee NFT resolution.
- Unresolved mention text renders as plain inline text without wave tooltip
  behavior.
- Wave mention links target `/waves/{waveId}` even when authored from DM
  threads.
- Suggestion results are search-based matches, not a full list of waves.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
