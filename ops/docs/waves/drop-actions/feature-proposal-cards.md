# Compact Proposal Cards

Parent: [Wave Drop Actions Index](README.md)

## Overview

Standard `Rank` and `Approve` Waves can present published proposals as compact
cards. A card is a reading entry point: selecting it opens the complete original
proposal with its full markdown, media, attachments, and multipart navigation.

The 6529 Network Museum uses compact proposal cards. Other existing standard
Waves keep their current drop presentation unless they are explicitly configured
to use cards. Chat messages and the specialized Memes, Curation, and Quorum
presentations are not changed by this setting.

## Location in the Site

- Standard Wave thread: `/waves/{waveId}`
- `Proposals` or leaderboard lists and grids
- `Approved`, `Winners`, and outcome-related proposal lists
- Compact right-sidebar leaderboard rows
- Quoted proposal and same-origin proposal-link previews
- Focused proposal view via `?drop={dropId}`

## Entry Points

- Open the 6529 Network Museum Wave and select `Proposals` or `Approved`.
- Open another standard `Rank` or `Approve` Wave configured for compact proposal
  cards.
- Select a quoted proposal or a same-origin proposal preview inside another
  drop.
- The Create Wave flow does not currently expose a compact-proposal-card
  control.

## User Journey

1. Open a proposal-bearing view in a Wave that uses compact cards.
2. Review the proposal label, authored title and excerpt, and any available
   proposal context.
3. Select the card with pointer, touch, `Enter`, or `Space`.
4. Read the complete original proposal in the focused drop view.
5. Close the focused view to return to the proposal list.

## Common Scenarios

- A proposal with a stored title uses that title.
- When a stored title is absent, the first authored non-empty line supplies the
  card title.
- The excerpt is taken from the proposal's original authored text. It is not a
  generated or editorial summary.
- If the authored first line matches the title, that repeated line is omitted
  from the excerpt.
- Multipart, media, and attachment labels appear only when the proposal really
  contains those items.
- A proposal with ready static image media can show one preview image. Animated,
  processing, or failed media is not used as the card preview.
- Very short proposals remain compact and do not receive invented descriptive
  text.
- The surrounding proposal row keeps its existing author, date, status, vote,
  voter, and action controls.

## Edge Cases

- A proposal with no usable title or authored text shows `Untitled proposal`.
- Long titles and excerpts are shortened only for the compact card. The focused
  view retains the complete source content.
- Multipart cards count the published number of parts even when the card shows
  content from only the available proposal data.
- If no ready static image is available, the card uses a ready static NFT
  preview when present; otherwise it renders without an image.
- Normal Chat drops inside the same Wave continue to use the normal message
  presentation.
- Gallery-first Memes and Curation views and Quorum proposal layouts keep their
  specialized renderers.

## Failure and Recovery

- If a preview image cannot load, the text card remains usable and the original
  media is still available after opening the proposal.
- If a proposal does not open, retry the card or use its existing open action.
- If a quoted proposal is unavailable, the quote area can show the existing
  unavailable or loading state while the surrounding drop remains readable.
- If a newly created Wave does not show compact cards, confirm the setting was
  enabled before creation and refresh the Wave.

## Limitations / Notes

- Compact cards do not generate summaries, categories, decision metadata, or
  proposal-specific labels beyond what the Wave and proposal already provide.
- The compact/full choice applies per Wave; it is not a personal display
  preference.
- Creating a Wave persists the choice as Wave metadata. Disabling the setting
  keeps the standard presentation.
- This card presentation is reusable across standard proposal-bearing Waves but
  is not a replacement for specialized Memes, Curation, or Quorum designs.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Leaderboards Index](../leaderboard/README.md)
- [Wave Creation Overview Step](../create/feature-overview-step.md)
- [Waves Index](../README.md)
