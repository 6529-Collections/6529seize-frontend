# Wave NFT Hashtag References

## Overview

Wave and DM composers support tracked NFT hashtag references.

- Type `$` to start NFT lookup.
- Use contract-and-token format (`$0x...:tokenId`) to fetch suggestions.
- Select a suggestion to insert a tracked NFT token.
- Submitted references serialize as `$[name]` and render as NFT cards when
  metadata matches.

## Location in the Site

- Wave thread composer: `/waves/{waveId}`
- Direct-message thread composer: `/messages?wave={waveId}` (no
  `/messages/{waveId}` route)

## Entry Points

- Open a wave or DM composer.
- Type `$` then enter a contract and token id (`$<contract>:<tokenId>`).
- Pick a suggestion with keyboard or pointer input.
- Submit the drop.

## User Journey

1. Type `$`.
2. Enter a valid Ethereum contract address and numeric token id.
3. Select one of the returned NFT suggestions (up to 5 shown).
4. The composer inserts the NFT token and tracks `contract`, `token`, and
   `name`.
5. Submit the drop.
6. Matching `$[name]` text renders as an NFT card in the posted content.

## Common Scenarios

- Reference a specific NFT in a wave thread discussion.
- Mix NFT references with user mentions and wave mentions in one drop.
- Open a rendered NFT reference card to navigate to its target collection/token
  route.

## Edge Cases

- Lookup returns no suggestions until the query is a valid
  `contract:tokenId` pair.
- Suggestions are disabled inside inline/fenced code.
- Suggestions are suppressed while slash-command trigger matching is active.
- Typing `$[name]` manually without selecting from lookup does not create NFT
  reference metadata.
- `Edit Message` does not provide NFT lookup for adding new references.

## Failure and Recovery

- If no suggestions appear, verify contract format, token id format, and token
  existence.
- If `$[name]` posts as plain text, create a new drop and reinsert the NFT via
  `$` lookup before submitting.

## Limitations / Notes

- Rendered NFT cards require both `$[name]` text and matching
  `referenced_nfts` metadata.
- Lookup depends on external NFT data availability.
- This page documents wave/DM composer behavior; create-wave description-step
  behavior is owned by [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Mentions](feature-wave-mentions.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
