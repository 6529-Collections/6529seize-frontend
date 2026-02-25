# Wave Mentions and NFT Hashtag Syntax

## Overview

Wave composers support two token types for references in post text:

- `#` starts wave mentions and resolves to links to existing waves.
- `$[name]` references NFTs, while `#[name]` is no longer used for NFTs.

Wave mentions are saved as clickable links after submit, so users can jump to the
mentioned wave directly from a drop body.
Mention links show a compact wave icon when one is available and expose a
hover-triggered summary card on desktop.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Wave creation: `/waves/create`
- Wave description editor surfaces that reuse the same Lexical composer

## Entry Points

- Open a wave or DM composer and start typing in the post body.
- Type `#` followed by a wave name fragment.
- Select a suggestion from the wave mention menu.
- Optionally continue typing `$[` to add an NFT reference token such as
  `$[token_name]`.
- Save or submit the drop.

## User Journey

1. In composer mode, type `#` plus the start of a wave name.
2. A suggestion list opens with matching wave options.
3. Pick a wave by pressing `Enter`, clicking the suggestion, or using keyboard
   navigation.
4. The composer inserts a wave mention token in the format `#[wave_name_in_content]`.
5. Continue editing and submit the drop.
6. The rendered drop displays that mention as a link that opens the mentioned
   wave and, on hover-capable devices, opens a wave summary tooltip.

## Common Scenarios

- Mentioning an existing wave from inside a standard thread composer.
- Mentioning a wave in wave-storm multi-part input.
- Opening an existing mention in a drop card to jump to `/waves?wave=<wave_id>`.
- Adding NFT references after mentions using `$[nft_name]`.

## Edge Cases

- In code blocks, mention suggestions are disabled so `#` and `$` remain literal
  text until users leave code context.
- `#` suggestions are context-aware; ambiguous or non-matching wave names remain
  plain text as `#wave_name_in_content` and do not open as links.
- When a wave mention is successfully resolved for rendering, it includes a small
  wave avatar preview inline before the wave name when available.
- If a wave name includes `]`, it is sanitized on insert so the token remains parseable.
- If the mention list is not yet available, you can still submit, but only typed
  tokens that match tracked mentions are promoted to links.

## Failure and Recovery

- If the suggestion list does not load, the user can retry typing or submit with
  plain text until connectivity/search returns.
- If a posted wave mention does not resolve to a visible link, users can reopen
  the composer and re-select the wave from the suggestion menu.
- If an NFT token is still needed, use the `$[name]` pattern instead of `#[name]`.

## Limitations / Notes

- Wave mentions require matching mention metadata to render as links.
- Mention links that do not have resolved metadata render inline as plain
  `#` text and do not use hover cards.
- `#[name]` tokens now represent wave mentions; they are not used for NFTs.
- NFT references use the `[...]` pattern with a leading `$` (for example
  `$[pixel-pie]`).
- Query results are loaded as suggestions from matching waves rather than all
  available public waves.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
